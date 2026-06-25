const statusStyles = {
  draft: 'bg-[#F1F0F2] text-[#6F6B7D]',
  pending: 'bg-warning-light text-warning',
  active: 'bg-success-light text-success',
  expired: 'bg-danger-light text-danger',
  terminated: 'bg-[#F1F0F2] text-[#A8AAAE]',
};

const statusLabels = {
  draft: 'Draft',
  pending: 'Pending',
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[status] || statusStyles.draft}`}>
      {statusLabels[status] || status}
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
