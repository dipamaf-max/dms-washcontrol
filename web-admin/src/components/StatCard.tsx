interface StatCardProps {
  label: string;
  value: string;
  accent?: string;
}

export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent ?? 'var(--color-white)' }}>
        {value}
      </div>
    </div>
  );
}
