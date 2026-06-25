export const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-700' },
  { value: 'terminated', label: 'Terminated', color: 'bg-gray-100 text-gray-700' },
];

export const ROLES = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  client: 'Client',
};

export const ROLE_OPTIONS = Object.entries(ROLES).map(([value, label]) => ({ value, label }));

export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN');
}

export function getStatusBadge(status) {
  return CONTRACT_STATUSES.find((s) => s.value === status) || CONTRACT_STATUSES[0];
}

export function getDefaultRoute(role) {
  return role === 'admin' ? '/admin' : '/';
}

export function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}
