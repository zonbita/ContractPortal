import { Appendix } from '../models/Appendix.js';
import { Contract } from '../models/Contract.js';
import { uploadFiles } from '../services/storageService.js';

async function canAccessContract(user, contractId) {
  const contract = await Contract.findById(contractId);
  if (!contract) return { allowed: false, contract: null };

  if (user.role === 'client' && String(user.customer) !== String(contract.customer)) {
    return { allowed: false, contract };
  }
  return { allowed: true, contract };
}

export const getAppendices = async (req, res) => {
  const { contractId } = req.params;
  const access = await canAccessContract(req.user, contractId);
  if (!access.contract) return res.status(404).json({ message: 'Contract not found' });
  if (!access.allowed) return res.status(403).json({ message: 'Access denied' });

  const appendices = await Appendix.find({ contract: contractId }).sort({ createdAt: -1 });
  res.json(appendices);
};

export const createAppendix = async (req, res) => {
  try {
    const { contractId } = req.params;
    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const files = req.files?.length ? await uploadFiles(req.files) : [];
    const appendix = await Appendix.create({
      contract: contractId,
      title: req.body.title,
      description: req.body.description,
      effectiveDate: req.body.effectiveDate,
      files,
      createdBy: req.user._id,
    });

    res.status(201).json(appendix);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateAppendix = async (req, res) => {
  try {
    const appendix = await Appendix.findById(req.params.id);
    if (!appendix) return res.status(404).json({ message: 'Appendix not found' });

    appendix.title = req.body.title ?? appendix.title;
    appendix.description = req.body.description ?? appendix.description;
    appendix.effectiveDate = req.body.effectiveDate ?? appendix.effectiveDate;

    if (req.files?.length) {
      const newFiles = await uploadFiles(req.files);
      appendix.files.push(...newFiles);
    }

    await appendix.save();
    res.json(appendix);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteAppendix = async (req, res) => {
  const appendix = await Appendix.findByIdAndDelete(req.params.id);
  if (!appendix) return res.status(404).json({ message: 'Appendix not found' });
  res.json({ message: 'Appendix deleted' });
};
