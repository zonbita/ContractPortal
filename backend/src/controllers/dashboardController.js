import { Document } from '../models/Document.js';
import { Payment } from '../models/Payment.js';
import { toContractResponse } from '../services/adapters/contractAdapter.js';

function getUpcomingWindow() {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  return { now, in30Days };
}

function buildBaseFilter(user) {
  if (user.role === 'client' && user.customer) {
    return { customer: user.customer };
  }
  return {};
}

function amountForType(type, meta = {}) {
  if (type === 'contract') return meta.value || 0;
  return meta.amount || 0;
}

function dateForType(type, doc) {
  const meta = doc.metadata || {};
  if (type === 'contract') return meta.endDate || doc.createdAt;
  if (type === 'invoice') return meta.dueDate || doc.createdAt;
  if (type === 'quotation') return meta.validUntil || doc.createdAt;
  return doc.createdAt;
}

function toRecentItem(type, doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    _id: obj._id,
    type,
    documentNumber: obj.documentNumber,
    title: obj.title,
    customer: obj.customer ? { _id: obj.customer._id, name: obj.customer.name } : null,
    status: obj.status,
    amount: amountForType(type, obj.metadata),
    date: dateForType(type, obj),
    direction: obj.metadata?.direction,
  };
}

async function getRecent(filter, type, extra = {}) {
  const docs = await Document.find({ ...filter, type, ...extra })
    .populate('customer', 'name company')
    .sort({ createdAt: -1 })
    .limit(5);
  return docs.map((d) => toRecentItem(type, d));
}

async function getRevenueSeries(paymentFilter, months = 6) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(1);
  start.setMonth(start.getMonth() - (months - 1));

  const rows = await Payment.aggregate([
    { $match: { ...paymentFilter, paidAt: { $gte: start } } },
    {
      $group: {
        _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const map = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.total]));
  const series = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    series.push({
      label: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      total: map.get(key) || 0,
    });
  }
  return series;
}

async function getInvoiceTrend(invoiceFilter, days = 30) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const now = new Date();

  const rows = await Document.aggregate([
    { $match: { ...invoiceFilter, createdAt: { $gte: start } } },
    {
      $addFields: {
        _bucket: {
          $switch: {
            branches: [
              { case: { $eq: ['$status', 'paid'] }, then: 'paid' },
              { case: { $eq: ['$status', 'cancelled'] }, then: 'skip' },
              {
                case: {
                  $and: [
                    { $ne: ['$metadata.dueDate', null] },
                    { $lt: ['$metadata.dueDate', now] },
                  ],
                },
                then: 'overdue',
              },
            ],
            default: 'unpaid',
          },
        },
      },
    },
    {
      $group: {
        _id: {
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' },
          d: { $dayOfMonth: '$createdAt' },
          b: '$_bucket',
        },
        total: { $sum: '$metadata.amount' },
      },
    },
  ]);

  const map = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}-${r._id.d}-${r._id.b}`, r.total]));
  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    series.push({
      label: `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
      paid: map.get(`${y}-${m}-${day}-paid`) || 0,
      unpaid: map.get(`${y}-${m}-${day}-unpaid`) || 0,
      overdue: map.get(`${y}-${m}-${day}-overdue`) || 0,
    });
  }
  return series;
}

export const getDashboardStats = async (req, res) => {
  const base = buildBaseFilter(req.user);
  const contractFilter = { ...base, type: 'contract' };
  const invoiceFilter = { ...base, type: 'invoice' };
  const quotationFilter = { ...base, type: 'quotation' };
  const paymentFilter = { ...base };

  const unpaidInvoiceFilter = { ...invoiceFilter, status: { $nin: ['paid', 'cancelled'] } };
  const now = new Date();

  const [
    totalContracts,
    activeContracts,
    completedContracts,
    upcoming,
    valueAgg,
    paymentAgg,
    latestPayment,
    totalInvoices,
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    totalQuotations,
    acceptedQuotations,
    totalReceipts,
    totalVouchers,
    revenueSeries,
    invoiceTrend,
    unpaidAmountAgg,
    overdueAmountAgg,
    recentContracts,
    recentInvoices,
    recentQuotations,
    recentReceipts,
    recentUnpaid,
    recentOverdue,
  ] = await Promise.all([
    Document.countDocuments(contractFilter),
    Document.countDocuments({ ...contractFilter, status: { $in: ['in_progress', 'signed', 'active'] } }),
    Document.countDocuments({ ...contractFilter, status: { $in: ['completed', 'expired', 'terminated'] } }),
    getUpcomingExpirations(contractFilter),
    Document.aggregate([
      { $match: contractFilter },
      { $group: { _id: null, totalValue: { $sum: '$metadata.value' } } },
    ]),
    Payment.aggregate([
      { $match: paymentFilter },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
    ]),
    Payment.findOne(paymentFilter).sort({ paidAt: -1, createdAt: -1 }).populate('contract', 'documentNumber title'),
    Document.countDocuments(invoiceFilter),
    Document.countDocuments({ ...invoiceFilter, status: 'paid' }),
    Document.countDocuments(unpaidInvoiceFilter),
    Document.countDocuments({ ...unpaidInvoiceFilter, 'metadata.dueDate': { $lt: now } }),
    Document.countDocuments(quotationFilter),
    Document.countDocuments({ ...quotationFilter, status: 'accepted' }),
    Document.countDocuments({ ...base, type: 'receipt' }),
    Document.countDocuments({ ...base, type: 'payment_voucher' }),
    getRevenueSeries(paymentFilter, 6),
    getInvoiceTrend(invoiceFilter, 30),
    Document.aggregate([
      { $match: unpaidInvoiceFilter },
      { $group: { _id: null, total: { $sum: '$metadata.amount' } } },
    ]),
    Document.aggregate([
      { $match: { ...unpaidInvoiceFilter, 'metadata.dueDate': { $lt: now } } },
      { $group: { _id: null, total: { $sum: '$metadata.amount' } } },
    ]),
    getRecent(base, 'contract'),
    getRecent(base, 'invoice'),
    getRecent(base, 'quotation'),
    Document.find({ ...base, type: { $in: ['receipt', 'payment_voucher'] } })
      .populate('customer', 'name company')
      .sort({ createdAt: -1 })
      .limit(5),
    Document.find({
      ...unpaidInvoiceFilter,
      $or: [{ 'metadata.dueDate': { $gte: now } }, { 'metadata.dueDate': null }, { 'metadata.dueDate': { $exists: false } }],
    })
      .populate('customer', 'name company')
      .sort({ createdAt: -1 })
      .limit(5),
    Document.find({ ...unpaidInvoiceFilter, 'metadata.dueDate': { $lt: now } })
      .populate('customer', 'name company')
      .sort({ 'metadata.dueDate': 1 })
      .limit(5),
  ]);

  const totalContractValue = valueAgg[0]?.totalValue || 0;
  const totalPaid = paymentAgg[0]?.totalPaid || 0;
  const recentReceiptsMapped = recentReceipts.map((d) => toRecentItem(d.type, d));

  res.json({
    contracts: {
      total: totalContracts,
      active: activeContracts,
      completed: completedContracts,
    },
    invoices: {
      total: totalInvoices,
      paid: paidInvoices,
      unpaid: unpaidInvoices,
      overdue: overdueInvoices,
      unpaidAmount: unpaidAmountAgg[0]?.total || 0,
      overdueAmount: overdueAmountAgg[0]?.total || 0,
    },
    quotations: {
      total: totalQuotations,
      accepted: acceptedQuotations,
      pending: Math.max(totalQuotations - acceptedQuotations, 0),
    },
    vouchers: {
      total: totalReceipts + totalVouchers,
      receipts: totalReceipts,
      vouchers: totalVouchers,
    },
    revenueSeries,
    invoiceTrend,
    invoiceStatus: {
      paid: paidInvoices,
      unpaid: Math.max(unpaidInvoices - overdueInvoices, 0),
      overdue: overdueInvoices,
    },
    recent: {
      contracts: recentContracts,
      invoices: recentInvoices,
      quotations: recentQuotations,
      vouchers: recentReceiptsMapped,
      unpaid: recentUnpaid.map((d) => toRecentItem('invoice', d)),
      overdue: recentOverdue.map((d) => toRecentItem('invoice', d)),
    },
    upcomingExpirations: upcoming,
    totalContractValue,
    totalPaid,
    outstanding: Math.max(totalContractValue - totalPaid, 0),
    latestPayment,

    totalContracts,
    activeContracts,
    expiredContracts: completedContracts,
    totalInvoices,
    unpaidInvoices,
    overdueInvoices,
  });
};

async function getUpcomingExpirations(filter) {
  const { now, in30Days } = getUpcomingWindow();
  const docs = await Document.find({
    ...filter,
    status: { $in: ['in_progress', 'signed', 'active', 'pending'] },
    'metadata.endDate': { $gte: now, $lte: in30Days },
  })
    .populate('customer', 'name company')
    .sort({ 'metadata.endDate': 1 })
    .limit(10);
  return docs.map(toContractResponse);
}

export const getUpcomingExpirationsList = async (req, res) => {
  const filter = { ...buildBaseFilter(req.user), type: 'contract' };
  const upcoming = await getUpcomingExpirations(filter);
  res.json(upcoming);
};
