import { useLanguage } from '../context/LanguageContext';
import { STATUS_COLORS } from '../utils/constants';

export default function StatusBadge({ status }) {
  const { statusLabel } = useLanguage();
  const styles = STATUS_COLORS[status] || STATUS_COLORS.draft;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles}`}>
      {statusLabel(status)}
    </span>
  );
}

export function RoleBadge({ role }) {
  const roleStyles = {
    admin: 'bg-primary-light text-primary',
    manager: 'bg-info-light text-info',
    staff: 'bg-success-light text-success',
    client: 'bg-[#F1F0F2] text-body',
  };
  const labels = { admin: 'Admin', manager: 'Manager', staff: 'Staff', client: 'Client' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleStyles[role] || roleStyles.client}`}>
      {labels[role] || role}
    </span>
  );
}
