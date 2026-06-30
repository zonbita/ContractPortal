export const DOCUMENT_TYPES = [
  'contract',
  'invoice',
  'quotation',
  'appendix',
  'acceptance_report',
  'receipt',
  'payment_voucher',
];

export const STATUS_BY_TYPE = {
  contract: ['draft', 'pending_sign', 'signed', 'in_progress', 'completed', 'expired', 'cancelled'],
  invoice: ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'],
  quotation: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
  appendix: ['draft', 'active', 'archived'],
  acceptance_report: ['draft', 'pending', 'approved', 'rejected'],
  receipt: ['pending_approval', 'approved', 'paid', 'cancelled'],
  payment_voucher: ['pending_approval', 'approved', 'paid', 'cancelled'],
};

export function getDefaultStatus(type) {
  return STATUS_BY_TYPE[type]?.[0] || 'draft';
}

export function validateMetadata(type, metadata = {}) {
  const errors = [];
  const m = metadata || {};

  switch (type) {
    case 'contract':
      if (!m.startDate) errors.push('startDate is required');
      if (!m.endDate) errors.push('endDate is required');
      break;
    case 'invoice':
      if (m.amount == null) errors.push('amount is required');
      if (!m.dueDate) errors.push('dueDate is required');
      break;
    case 'quotation':
      if (!m.validUntil) errors.push('validUntil is required');
      if (m.amount == null) errors.push('amount is required');
      break;
    case 'receipt':
    case 'payment_voucher':
      if (m.amount == null) errors.push('amount is required');
      break;
    default:
      break;
  }

  if (errors.length) {
    throw new Error(errors.join(', '));
  }

  return normalizeMetadata(type, m);
}

function num(v) {
  return Number(v) || 0;
}

function date(v) {
  return v ? new Date(v) : undefined;
}

export function normalizeMetadata(type, metadata = {}) {
  const m = { ...metadata };

  switch (type) {
    case 'contract':
      return {
        contractType: m.contractType || '',
        manager: m.manager || '',
        department: m.department || '',
        valueBeforeTax: num(m.valueBeforeTax),
        vat: num(m.vat),
        value: num(m.value),
        currency: m.currency || 'VND',
        exchangeRate: num(m.exchangeRate),
        signDate: date(m.signDate),
        startDate: date(m.startDate),
        endDate: date(m.endDate),
        termMonths: num(m.termMonths),
        paymentTerms: m.paymentTerms || '',
        paymentMethod: m.paymentMethod || '',
        paymentInstallments: num(m.paymentInstallments),
        specialTerms: m.specialTerms || '',
        internalNote: m.internalNote || '',
        description: m.description || '',
        remindersSent: m.remindersSent || [],
      };
    case 'invoice':
      return {
        invoiceForm: m.invoiceForm || '',
        invoiceSerial: m.invoiceSerial || '',
        invoiceType: m.invoiceType || '',
        createdDate: date(m.createdDate),
        issueDate: date(m.issueDate),
        dueDate: date(m.dueDate),
        amount: num(m.amount),
        vat: num(m.vat),
        discount: num(m.discount),
        total: num(m.total),
        paid: Boolean(m.paid),
        paidAmount: num(m.paidAmount),
        supplier: m.supplier || '',
        currency: m.currency || 'VND',
      };
    case 'quotation':
      return {
        createdDate: date(m.createdDate),
        validUntil: date(m.validUntil),
        amount: num(m.amount),
        vat: num(m.vat),
        discount: num(m.discount),
        total: num(m.total),
        manager: m.manager || '',
      };
    case 'appendix':
      return {
        effectiveDate: date(m.effectiveDate),
        description: m.description || '',
      };
    case 'acceptance_report':
      return {
        acceptanceDate: date(m.acceptanceDate),
        linkedContract: m.linkedContract || null,
      };
    case 'receipt':
    case 'payment_voucher':
      return {
        amount: num(m.amount),
        currency: m.currency || 'VND',
        paymentMethod: m.paymentMethod || '',
        direction: m.direction || (type === 'receipt' ? 'in' : 'out'),
        preparedBy: m.preparedBy || '',
        approvedBy: m.approvedBy || '',
        partyType: m.partyType || '',
        reason: m.reason || '',
        note: m.note || '',
      };
    default:
      return m;
  }
}

export function buildSearchText(doc) {
  const parts = [
    doc.title,
    doc.documentNumber,
    doc.description,
    ...(doc.tags || []),
    doc.ocrText,
  ];

  const m = doc.metadata || {};
  if (m.supplier) parts.push(m.supplier);
  if (m.description) parts.push(m.description);

  return parts.filter(Boolean).join(' ').toLowerCase();
}
