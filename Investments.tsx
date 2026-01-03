import { Investment } from "../../types/finance";

interface Props {
  investments: Investment[];
}

export function Investments({ investments }: Props) {
  if (investments.length === 0) {
    return <p>No investments added.</p>;
  }

  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.amountInvested,
    0
  );

  const totalCurrentValue = investments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0
  );

  return (
    <section>
      <h2>Investments</h2>
      <div>
        Total Invested: ${totalInvested.toFixed(2)} | Current Value: $
        {totalCurrentValue.toFixed(2)}
      </div>
      <ul>
        {investments.map((inv) => (
          <li key={inv.id} style={{ marginBottom: "1rem" }}>
            <strong>{inv.name}</strong> - Invested: ${inv.amountInvested.toFixed(
              2
            )} | Current: ${inv.currentValue.toFixed(2)} | Risk:{" "}
            {inv.riskLevel ?? "Unknown"}
            <div>Purchased on: {inv.purchaseDate}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
