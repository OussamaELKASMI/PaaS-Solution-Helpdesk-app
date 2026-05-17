export default function StatusBadge({ label, tone }) {
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

