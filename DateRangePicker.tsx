interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onChange }: Props) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h3>Filter by Date</h3>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => onChange(e.target.value, to)}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(e) => onChange(from, e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}

