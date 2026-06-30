import {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  updateDocumentStatus,
  getContractEndDate,
  getContractRemindersSent,
  pushContractReminder,
} from '../documentService.js';

export function toContractResponse(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const meta = obj.metadata || {};
  return {
    _id: obj._id,
    contractNumber: obj.documentNumber,
    title: obj.title,
    customer: obj.customer,
    contractType: meta.contractType || '',
    manager: meta.manager || '',
    department: meta.department || '',
    valueBeforeTax: meta.valueBeforeTax || 0,
    vat: meta.vat || 0,
    value: meta.value || 0,
    currency: meta.currency || 'VND',
    exchangeRate: meta.exchangeRate || 0,
    signDate: meta.signDate,
    startDate: meta.startDate,
    endDate: meta.endDate,
    termMonths: meta.termMonths || 0,
    paymentTerms: meta.paymentTerms || '',
    paymentMethod: meta.paymentMethod || '',
    paymentInstallments: meta.paymentInstallments || 0,
    specialTerms: meta.specialTerms || '',
    internalNote: meta.internalNote || '',
    status: obj.status,
    description: obj.description || meta.description || '',
    files: obj.files,
    remindersSent: meta.remindersSent || [],
    createdBy: obj.createdBy,
    ocrText: obj.ocrText,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export function fromContractBody(body) {
  return {
    type: 'contract',
    title: body.title,
    documentNumber: body.contractNumber,
    customer: body.customer,
    status: body.status || 'draft',
    description: body.description,
    contractType: body.contractType,
    manager: body.manager,
    department: body.department,
    valueBeforeTax: body.valueBeforeTax,
    vat: body.vat,
    value: body.value,
    currency: body.currency,
    exchangeRate: body.exchangeRate,
    signDate: body.signDate,
    startDate: body.startDate,
    endDate: body.endDate,
    termMonths: body.termMonths,
    paymentTerms: body.paymentTerms,
    paymentMethod: body.paymentMethod,
    paymentInstallments: body.paymentInstallments,
    specialTerms: body.specialTerms,
    internalNote: body.internalNote,
  };
}

export async function listContracts(user, query) {
  const docs = await listDocuments(user, { ...query, type: 'contract' });
  return docs.map(toContractResponse);
}

export async function getContract(id, user) {
  const result = await getDocumentById(id, user);
  if (!result) return null;
  if (result.forbidden) return { forbidden: true };
  if (result.type !== 'contract') return null;
  return toContractResponse(result);
}

export async function createContract(user, body, files) {
  const doc = await createDocument(user, fromContractBody(body), files);
  return toContractResponse(doc);
}

export async function updateContract(id, user, body, files) {
  const existing = await getDocumentById(id, user);
  if (!existing || existing.forbidden) return existing;
  const doc = await updateDocument(id, user, fromContractBody(body), files);
  return toContractResponse(doc);
}

export async function deleteContract(id, user) {
  return deleteDocument(id, user);
}

export async function updateContractStatus(id, user, status) {
  const doc = await updateDocumentStatus(id, user, status);
  return toContractResponse(doc);
}

export {
  getContractEndDate,
  getContractRemindersSent,
  pushContractReminder,
};
