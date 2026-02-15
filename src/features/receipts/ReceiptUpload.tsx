import { useState } from "react";
import { storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createWorker } from "tesseract.js";
import { firebaseAuthService } from "@/services/firebase/auth.service";

interface ReceiptUploadProps {
  onReceiptProcessed: (data: {
    amount: number;
    description: string;
    imageUrl: string;
  }) => void;
  onClose: () => void;
}

export function ReceiptUpload({
  onReceiptProcessed,
  onClose
}: ReceiptUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState("");
  const [extractedAmount, setExtractedAmount] = useState<number | null>(null);
  const [extractedDescription, setExtractedDescription] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const extractDataFromText = (text: string) => {
    // Find amounts (e.g., $10.50, 10.50, $10, 10)
    const amountRegex = /\$?\s*(\d+[.,]\d{2}|\d+)/g;
    const amounts = text.match(amountRegex);

    let bestAmount = 0;
    if (amounts && amounts.length > 0) {
      // Get the largest amount (usually the total)
      const numericAmounts = amounts.map((a) =>
        parseFloat(a.replace(/[$,\s]/g, ""))
      );
      bestAmount = Math.max(...numericAmounts);
    }

    // Try to find merchant/description
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const firstLine = lines[0] || "";

    return {
      amount: bestAmount,
      description: firstLine.substring(0, 50) // First 50 chars
    };
  };

  const processReceipt = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setOcrResult("Processing image...");

    try {
      // Get current user
      const user = firebaseAuthService.getCurrentUser();
      if (!user) {
        alert("You must be logged in to upload receipts");
        setProcessing(false);
        return;
      }

      // Step 1: OCR processing
      const worker = await createWorker("eng");
      const {
        data: { text }
      } = await worker.recognize(selectedFile);
      await worker.terminate();

      setOcrResult(text);

      // Step 2: Extract data
      const { amount, description } = extractDataFromText(text);
      setExtractedAmount(amount);
      setExtractedDescription(description);

      // Step 3: Upload to Firebase Storage
      const timestamp = Date.now();
      const filename = `${timestamp}-${selectedFile.name}`;
      const storageRef = ref(storage, `receipts/${user.uid}/${filename}`);

      await uploadBytes(storageRef, selectedFile);
      const imageUrl = await getDownloadURL(storageRef);

      // Step 4: Return data to parent
      onReceiptProcessed({
        amount: amount || 0,
        description: description || "Receipt",
        imageUrl
      });
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("Failed to process receipt. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900">Upload Receipt</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Take a photo or upload a receipt image to auto-extract details
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          {!preview && (
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload" className="cursor-pointer">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-lg font-medium text-neutral-900 mb-2">
                  Upload Receipt Image
                </p>
                <p className="text-sm text-neutral-600">
                  Click to browse or drag and drop
                </p>
              </label>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div>
              <div className="mb-4">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full h-64 object-contain bg-neutral-50 rounded-lg"
                />
              </div>

              {/* OCR Results */}
              {ocrResult && (
                <div className="mb-4 p-4 bg-neutral-50 rounded-lg">
                  <h4 className="font-semibold text-neutral-900 mb-2">
                    Extracted Text:
                  </h4>
                  <pre className="text-xs text-neutral-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {ocrResult}
                  </pre>
                </div>
              )}

              {/* Extracted Data */}
              {extractedAmount !== null && (
                <div className="space-y-3">
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <p className="text-sm text-neutral-600">Detected Amount</p>
                    <p className="text-2xl font-bold text-success">
                      ${extractedAmount.toFixed(2)}
                    </p>
                  </div>

                  {extractedDescription && (
                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <p className="text-sm text-neutral-600">
                        Detected Merchant
                      </p>
                      <p className="font-semibold text-neutral-900">
                        {extractedDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Change Image Button */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    setPreview("");
                    setSelectedFile(null);
                    setOcrResult("");
                    setExtractedAmount(null);
                    setExtractedDescription("");
                  }}
                  className="btn btn-outline text-sm"
                >
                  Choose Different Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-neutral-200 flex gap-3">
          <button onClick={onClose} className="btn btn-outline flex-1">
            Cancel
          </button>
          <button
            onClick={processReceipt}
            disabled={!selectedFile || processing}
            className="btn btn-primary flex-1"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              "Process Receipt"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
