import { TicketFilters, TicketStatus, Priority } from '../../types';
import { Input } from '../Input';
import './FilterBar.scss';

interface FilterBarProps {
  filters: TicketFilters;
  onChange: (filters: TicketFilters) => void;
}

const STATUS_OPTIONS: { value: TicketStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: Priority | ''; label: string }[] = [
  { value: '', label: 'All priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <Input
        className="filter-bar__search"
        placeholder="Search tickets..."
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />

      <select
        className="filter-bar__select"
        value={filters.status ?? ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value as TicketStatus | '' })}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        className="filter-bar__select"
        value={filters.priority ?? ''}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as Priority | '' })}
      >
        {PRIORITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <label className="filter-bar__checkbox">
        <input
          type="checkbox"
          checked={filters.overdue ?? false}
          onChange={(e) => onChange({ ...filters, overdue: e.target.checked })}
        />
        Overdue only
      </label>
    </div>
  );
}
