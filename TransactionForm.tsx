import { useState, FormEvent } from "react";
import { Transaction, TransactionType } from "../../types/finance";

interface Props {
  onAddTransaction: (transaction: Transaction) => void;
}

const categories = [
  "Salary",
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Others",
];

export function TransactionForm({ onAddTransaction }: Props) {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");

  function resetForm() {
    setType("EXPENSE");
    setCategory(categories[0]);
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Enter a valid amount greater than 0.");
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      category,
      amount: parsedAmount,
      date,
      note: note.trim() || undefined,
    };

    onAddTransaction(newTransaction);
    resetForm();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <div>
        <label>
          Type:
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Category:
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Amount (USD):
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Note:
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
          />
        </label>
      </div>

      <button type="submit">Add Transaction</button>
    </form>
  );
}
