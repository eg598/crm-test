import './StatCard.scss';

interface StatCardProps {
  label: string;
  value: number | string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}
