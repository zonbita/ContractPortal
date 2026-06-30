import mongoose from 'mongoose';
import { Document } from '../models/Document.js';
import { Payment } from '../models/Payment.js';
import { logActivity } from './documentService.js';

function toObjectId(id) {
  if (!id) return id;
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

function assertCustomerAccess(user, customerId) {
  if (user.role === 'client' && user.customer && String(user.customer) !== String(customerId)) {
    return false;
  }
  return true;
}

async function getContractForPayment(contractId, user) {
  const contract = await Document.findOne({ _id: contractId, type: 'contract' }).populate('customer', 'name email company');
  if (!contract) return null;
  if (!assertCustomerAccess(user, contract.customer?._id || contract.customer)) return { forbidden: true };
  return contract;
}

export async function listPayments(user, query = {}) {
  const filter = {};
  if (query.contract) filter.contract = query.contract;
  if (query.customer) filter.customer = query.customer;
  if (user.role === 'client' && user.customer) filter.customer = user.customer;

  return Payment.find(filter)
    .populate('contract', 'documentNumber title metadata type')
    .populate('customer', 'name company email')
    .populate('createdBy', 'name email')
    .sort({ paidAt: -1, createdAt: -1 });
}

export async function createPayment(user, body) {
  const contract = await getContractForPayment(body.contract, user);
  if (!contract) throw new Error('Contract not found');
  if (contract.forbidden) return { forbidden: true };

  const payment = await Payment.create({
    contract: contract._id,
    customer: contract.customer?._id || contract.customer,
    amount: Number(body.amount) || 0,
    paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
    method: body.method || '',
    reference: body.reference || '',
    note: body.note || '',
    createdBy: user._id,
  });

  await logActivity(contract._id, user._id, 'payment_added', `Payment received: ${payment.amount}`, {
    payment: payment._id,
    amount: payment.amount,
  });

  return Payment.findById(payment._id)
    .populate('contract', 'documentNumber title metadata type')
    .populate('customer', 'name company email')
    .populate('createdBy', 'name email');
}

export async function deletePayment(user, id) {
  const payment = await Payment.findById(id);
  if (!payment) return null;
  if (!assertCustomerAccess(user, payment.customer)) return { forbidden: true };

  await Payment.deleteOne({ _id: id });
  await logActivity(payment.contract, user._id, 'payment_deleted', `Payment deleted: ${payment.amount}`, {
    payment: payment._id,
    amount: payment.amount,
  });
  return payment;
}

export async function getPaymentSummary(user, query = {}) {
  const contractFilter = { type: 'contract' };
  const paymentFilter = {};

  if (query.contract) {
    contractFilter._id = toObjectId(query.contract);
    paymentFilter.contract = toObjectId(query.contract);
  }
  if (query.customer) {
    contractFilter.customer = toObjectId(query.customer);
    paymentFilter.customer = toObjectId(query.customer);
  }
  if (user.role === 'client' && user.customer) {
    contractFilter.customer = toObjectId(user.customer);
    paymentFilter.customer = toObjectId(user.customer);
  }

  const [contractAgg, paymentAgg, latestPayment] = await Promise.all([
    Document.aggregate([
      { $match: contractFilter },
      { $group: { _id: null, totalContractValue: { $sum: '$metadata.value' }, contractCount: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: paymentFilter },
      { $group: { _id: null, totalPaid: { $sum: '$amount' }, paymentCount: { $sum: 1 } } },
    ]),
    Payment.findOne(paymentFilter).sort({ paidAt: -1, createdAt: -1 }).populate('contract', 'documentNumber title'),
  ]);

  const totalContractValue = contractAgg[0]?.totalContractValue || 0;
  const totalPaid = paymentAgg[0]?.totalPaid || 0;

  return {
    totalContractValue,
    totalPaid,
    outstanding: Math.max(totalContractValue - totalPaid, 0),
    contractCount: contractAgg[0]?.contractCount || 0,
    paymentCount: paymentAgg[0]?.paymentCount || 0,
    latestPayment,
  };
}
