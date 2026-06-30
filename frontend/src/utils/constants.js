export const DOCUMENT_TYPES = {
  contract: 'Hợp đồng',
  invoice: 'Hóa đơn',
  quotation: 'Báo giá',
  appendix: 'Phụ lục',
  acceptance_report: 'Biên bản nghiệm thu',
  receipt: 'Phiếu thu',
  payment_voucher: 'Phiếu chi',
};

export const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/25',
  pending: 'bg-warning-light text-warning ring-warning/20',
  pending_sign: 'bg-warning-light text-warning ring-warning/20',
  signed: 'bg-info-light text-info ring-info/20',
  in_progress: 'bg-primary-light text-primary ring-primary/20',
  completed: 'bg-success-light text-success ring-success/20',
  active: 'bg-success-light text-success ring-success/20',
  expired: 'bg-danger-light text-danger ring-danger/20',
  terminated: 'bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:ring-zinc-500/25',
  sent: 'bg-info-light text-info ring-info/20',
  viewed: 'bg-info-light text-info ring-info/20',
  partial: 'bg-warning-light text-warning ring-warning/20',
  paid: 'bg-success-light text-success ring-success/20',
  overdue: 'bg-danger-light text-danger ring-danger/20',
  cancelled: 'bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:ring-zinc-500/25',
  accepted: 'bg-success-light text-success ring-success/20',
  rejected: 'bg-danger-light text-danger ring-danger/20',
  confirmed: 'bg-primary-light text-primary ring-primary/20',
  pending_approval: 'bg-warning-light text-warning ring-warning/20',
  approved: 'bg-success-light text-success ring-success/20',
  archived: 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/25',
};

export const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_sign', label: 'Pending sign' },
  { value: 'signed', label: 'Signed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const QUOTATION_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

export const RECEIPT_STATUSES = [
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const STATUS_OPTIONS_BY_TYPE = {
  contract: CONTRACT_STATUSES,
  invoice: INVOICE_STATUSES,
  quotation: QUOTATION_STATUSES,
  receipt: RECEIPT_STATUSES,
  payment_voucher: RECEIPT_STATUSES,
  appendix: [{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }],
  acceptance_report: [{ value: 'draft', label: 'Draft' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }],
};

export const ROLES = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  client: 'Client',
};

export const ROLE_OPTIONS = Object.entries(ROLES).map(([value, label]) => ({ value, label }));

export function formatCurrency(value, locale = 'vi-VN') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'VND' }).format(value || 0);
}

export function formatDate(date, locale = 'vi-VN') {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(locale);
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

export function getDocumentDetailPath(doc) {
  if (doc.type === 'contract') return `/contracts/${doc._id}`;
  return `/documents/${doc._id}`;
}

export function getDocumentListPath(type) {
  const paths = {
    contract: '/contracts',
    invoice: '/invoices',
    quotation: '/quotations',
    receipt: '/receipts',
    payment_voucher: '/receipts',
  };
  return paths[type] || '/search';
}
