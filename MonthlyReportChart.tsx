import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MonthlyReport } from "../../utils/reporting";

interface Props {
  data: MonthlyReport[];
}

export function MonthlyReportChart({ data }: Props) {
  return (
    <section>
      <h2>Monthly Income & Expenses</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#4caf50" name="Income" />
          <Bar dataKey="expense" fill="#f44336" name="Expense" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
