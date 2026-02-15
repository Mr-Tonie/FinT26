import { useState, useEffect, useRef } from "react";
import { Layout } from "@/shared/components/Layout";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import { firestoreService } from "@/services/firebase/firestore.service";
import {
  aiAssistant,
  type FinancialContext
} from "@/services/ai/assistant.service";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [context, setContext] = useState<FinancialContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFinancialContext();
    addWelcomeMessage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadFinancialContext = async () => {
    const user = firebaseAuthService.getCurrentUser();
    if (!user) return;

    try {
      const [transactions, budgets, savingsGoals, investments, stats] =
        await Promise.all([
          firestoreService.transactions.getAll(user.uid),
          firestoreService.budgets.getAll(user.uid),
          firestoreService.savingsGoals.getAll(user.uid),
          firestoreService.investments.getAll(user.uid),
          firestoreService.transactions.getStatistics(user.uid)
        ]);

      setContext({
        transactions,
        budgets,
        savingsGoals,
        investments,
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        netCashflow: stats.netCashflow
      });
    } catch (error) {
      console.error("Error loading context:", error);
    }
  };

  const addWelcomeMessage = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello Somebody! I'm your AI Financial Assistant. I can help you:\n\n• Analyze your spending patterns\n• Get personalized budget recommendations\n• Answer questions about your finances\n• Predict when you'll reach savings goals\n\nWhat would you like to know?",
        timestamp: new Date()
      }
    ]);
  };

  const handleAnalyzeFinances = async () => {
    if (!context) return;

    setAnalyzing(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: " Analyze my finances",
        timestamp: new Date()
      }
    ]);

    try {
      const analysis = await aiAssistant.analyzeFinances(context);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: analysis,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            " Sorry, I encountered an error analyzing your finances. Please make sure your API key is set correctly.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !context) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date()
      }
    ]);

    try {
      const answer = await aiAssistant.answerQuestion(userMessage, context);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: " Sorry, I encountered an error. Please try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "How much did I spend on food this month?",
    "Am I saving enough money?",
    "What's my biggest expense category?",
    "Should I adjust my budget?"
  ];

  return (
    <Layout>
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-neutral-900">
            AI Financial Assistant
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Powered by Google Gemini - Get smart insights about your finances
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <button
            onClick={handleAnalyzeFinances}
            disabled={analyzing || !context}
            className="btn btn-primary"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                Analyzing...
              </>
            ) : (
              " Analyze My Finances"
            )}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 card overflow-y-auto mb-4 p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === "user"
                      ? "text-primary-100"
                      : "text-neutral-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-neutral-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-sm text-neutral-600 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(question);
                  }}
                  className="btn btn-outline text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="card p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask me anything about your finances..."
              className="input flex-1"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
