import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CategorySummary } from "../../utils/categoryReport";

interface Props {
  title: string;
  data: CategorySummary[];
}

const COLORS = [
  "#1976d2",
  "#26a69a",
  "#ef5350",
  "#ab47bc",
  "#ffa726",
  "#66bb6a",
  "#8d6e63",
];

export function CategoryPieChart({ title, data }: Props) {
  if (data.length === 0) {
    return <p>No data available for {title.toLowerCase()}.</p>;
  }

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data as unknown as any[]}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.category}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </section>
  );
}
