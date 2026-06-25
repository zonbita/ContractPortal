import { Customer } from '../models/Customer.js';

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
