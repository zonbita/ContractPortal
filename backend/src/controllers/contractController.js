import {
  listContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  updateContractStatus,
} from '../services/adapters/contractAdapter.js';

export const getContracts = async (req, res) => {
  const contracts = await listContracts(req.user, req.query);
  res.json(contracts);
};

export const getContractById = async (req, res) => {
  const contract = await getContract(req.params.id, req.user);
  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  if (contract.forbidden) return res.status(403).json({ message: 'Access denied' });
  res.json(contract);
};

export const createContractHandler = async (req, res) => {
  try {
    const contract = await createContract(req.user, req.body, req.files);
    res.status(201).json(contract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateContractHandler = async (req, res) => {
  try {
    const contract = await updateContract(req.params.id, req.user, req.body, req.files);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    if (contract.forbidden) return res.status(403).json({ message: 'Access denied' });
    res.json(contract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteContractHandler = async (req, res) => {
  const contract = await deleteContract(req.params.id, req.user);
  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  res.json({ message: 'Contract deleted' });
};

export const updateContractStatusHandler = async (req, res) => {
  const contract = await updateContractStatus(req.params.id, req.user, req.body.status);
  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  res.json(contract);
};
