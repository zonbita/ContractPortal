import { Contract } from '../models/Contract.js';
import { uploadFiles } from '../services/storageService.js';

function buildContractFilter(user, query) {
  const filter = {};
  if (user.role === 'client' && user.customer) {
    filter.customer = user.customer;
  }
  if (query.status) filter.status = query.status;
  if (query.customer) filter.customer = query.customer;
  if (query.search) {
    filter.$or = [
      { contractNumber: { $regex: query.search, $options: 'i' } },
      { title: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
}

function parseContractBody(body) {
  return {
    contractNumber: body.contractNumber,
    title: body.title,
    customer: body.customer,
    startDate: body.startDate,
    endDate: body.endDate,
    value: body.value ? Number(body.value) : 0,
    status: body.status || 'draft',
    description: body.description,
  };
}

export const getContracts = async (req, res) => {
  const filter = buildContractFilter(req.user, req.query);
  const contracts = await Contract.find(filter)
    .populate('customer', 'name email company')
    .sort({ createdAt: -1 });
  res.json(contracts);
};

export const getContract = async (req, res) => {
  const contract = await Contract.findById(req.params.id).populate('customer');
  if (!contract) return res.status(404).json({ message: 'Contract not found' });

  if (req.user.role === 'client' && String(req.user.customer) !== String(contract.customer._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(contract);
};

export const createContract = async (req, res) => {
  try {
    const data = parseContractBody(req.body);
    const files = req.files?.length ? await uploadFiles(req.files) : [];

    const contract = await Contract.create({
      ...data,
      files,
      createdBy: req.user._id,
    });

    const populated = await Contract.findById(contract._id).populate('customer', 'name email company');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const data = parseContractBody(req.body);
    Object.assign(contract, data);

    if (req.files?.length) {
      const newFiles = await uploadFiles(req.files);
      contract.files.push(...newFiles);
    }

    await contract.save();
    const populated = await Contract.findById(contract._id).populate('customer', 'name email company');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteContract = async (req, res) => {
  const contract = await Contract.findByIdAndDelete(req.params.id);
  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  res.json({ message: 'Contract deleted' });
};

export const updateContractStatus = async (req, res) => {
  const { status } = req.body;
  const contract = await Contract.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('customer', 'name email company');

  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  res.json(contract);
};
