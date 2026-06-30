import { Customer } from '../models/Customer.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Document } from '../models/Document.js';
import { Payment } from '../models/Payment.js';
import { getPaymentSummary } from '../services/paymentService.js';
import { toContractResponse } from '../services/adapters/contractAdapter.js';

function buildCustomerFilter(user, query) {
  const filter = {};
  if (user.role === 'client' && user.customer) {
    filter._id = user.customer;
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { company: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
}

export const getCustomers = async (req, res) => {
  const filter = buildCustomerFilter(req.user, req.query);
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json(customers);
};

export const getCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  if (req.user.role === 'client' && String(req.user.customer) !== String(customer._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(customer);
};

export const getCustomerOverview = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  if (req.user.role === 'client' && String(req.user.customer) !== String(customer._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const contracts = await Document.find({ type: 'contract', customer: customer._id })
    .populate('customer', 'name email company')
    .sort({ createdAt: -1 });
  const contractIds = contracts.map((doc) => doc._id);

  const [paymentSummary, payments, activity] = await Promise.all([
    getPaymentSummary(req.user, { customer: customer._id }),
    Payment.find({ customer: customer._id })
      .populate('contract', 'documentNumber title')
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(10),
    ActivityLog.find({ document: { $in: contractIds } })
      .populate('user', 'name email')
      .populate('document', 'documentNumber title type')
      .sort({ createdAt: -1 })
      .limit(20),
  ]);

  res.json({
    customer,
    contracts: contracts.map(toContractResponse),
    paymentSummary,
    recentPayments: payments,
    activity,
  });
};

export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
};

export const deleteCustomer = async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json({ message: 'Customer deleted' });
};
