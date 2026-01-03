import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { NetWorthPoint } from "../../utils/netWorth";

interface Props {
  data: NetWorthPoint[];
}

export function NetWorthChart({ data }: Props) {
  if (data.length === 0) {
    return <p>No net worth data available.</p>;
  }

  return (
    <section style={{ marginTop: "3rem" }}>
      <h2>Net Worth Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data as unknown as any[]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1976d2"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
