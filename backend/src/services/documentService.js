import { Document } from '../models/Document.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { validateMetadata, getDefaultStatus, DOCUMENT_TYPES } from '../schemas/documentMetadata.js';
import { uploadFiles } from './storageService.js';
import { runOcrForVersion } from './ocrService.js';

function buildAccessFilter(user, query = {}) {
  const filter = {};
  if (user.role === 'client' && user.customer) {
    filter.customer = user.customer;
  }
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.customer) filter.customer = query.customer;
  if (query.parentDocument) filter.parentDocument = query.parentDocument;
  return filter;
}

export async function logActivity(documentId, userId, action, description, diff = null) {
  await ActivityLog.create({ document: documentId, user: userId, action, description, diff });
}

export async function listDocuments(user, query) {
  const filter = buildAccessFilter(user, query);
  if (query.search) {
    filter.$or = [
      { documentNumber: { $regex: query.search, $options: 'i' } },
      { title: { $regex: query.search, $options: 'i' } },
      { searchText: { $regex: query.search, $options: 'i' } },
    ];
  }
  return Document.find(filter)
    .populate('customer', 'name email company')
    .populate('parentDocument', 'documentNumber title type')
    .sort({ createdAt: -1 });
}

export async function getDocumentById(id, user) {
  const doc = await Document.findById(id)
    .populate('customer')
    .populate('parentDocument', 'documentNumber title type')
    .populate('versions.uploadedBy', 'name email');
  if (!doc) return null;
  if (user.role === 'client' && user.customer && String(doc.customer?._id) !== String(user.customer)) {
    return { forbidden: true };
  }
  return doc;
}

export async function createDocument(user, body, files = []) {
  if (!DOCUMENT_TYPES.includes(body.type)) {
    throw new Error('Invalid document type');
  }

  const metadata = validateMetadata(body.type, parseMetadataFromBody(body.type, body));
  const uploaded = files.length ? await uploadFiles(files) : [];
  const status = resolveDocumentStatus(body.type, body.status, metadata);

  const doc = await Document.create({
    type: body.type,
    title: body.title,
    documentNumber: body.documentNumber,
    customer: body.customer || null,
    status,
    description: body.description || '',
    tags: parseTags(body.tags),
    metadata,
    files: uploaded,
    parentDocument: body.parentDocument || null,
    createdBy: user._id,
  });

  await logActivity(doc._id, user._id, 'created', `Created ${body.type} ${doc.documentNumber}`);

  if (uploaded.length) {
    await addVersionsForFiles(doc, user, uploaded);
    runOcrForNewVersions(doc._id, uploaded.length).catch((err) => console.error('[OCR]', err.message));
  }

  return Document.findById(doc._id).populate('customer', 'name email company');
}

export async function updateDocument(id, user, body, files = []) {
  const doc = await Document.findById(id);
  if (!doc) return null;

  if (body.title) doc.title = body.title;
  if (body.documentNumber) doc.documentNumber = body.documentNumber;
  if (body.customer !== undefined) doc.customer = body.customer || null;
  if (body.status) doc.status = body.status;
  if (body.description !== undefined) doc.description = body.description;
  if (body.tags) doc.tags = parseTags(body.tags);
  if (body.parentDocument !== undefined) doc.parentDocument = body.parentDocument || null;

  const metaUpdates = parseMetadataFromBody(doc.type, body);
  if (Object.keys(metaUpdates).length) {
    doc.metadata = { ...doc.metadata, ...validateMetadata(doc.type, { ...doc.metadata, ...metaUpdates }) };
  }
  doc.status = resolveDocumentStatus(doc.type, doc.status, doc.metadata);

  if (files.length) {
    const newFiles = await uploadFiles(files);
    doc.files.push(...newFiles);
    await logActivity(doc._id, user._id, 'file_uploaded', `Uploaded ${newFiles.length} file(s)`);
    await addVersionsForFiles(doc, user, newFiles);
    runOcrForNewVersions(doc._id, newFiles.length).catch((err) => console.error('[OCR]', err.message));
  }

  await doc.save();
  await logActivity(doc._id, user._id, 'updated', `Updated ${doc.type} ${doc.documentNumber}`);
  return Document.findById(doc._id).populate('customer', 'name email company');
}

export async function deleteDocument(id, user) {
  const doc = await Document.findByIdAndDelete(id);
  if (doc) {
    await logActivity(doc._id, user._id, 'deleted', `Deleted ${doc.type} ${doc.documentNumber}`);
  }
  return doc;
}

export async function updateDocumentStatus(id, user, status) {
  const doc = await Document.findById(id);
  if (!doc) return null;
  const oldStatus = doc.status;
  doc.status = status;
  await doc.save();
  await logActivity(doc._id, user._id, 'status_changed', `Status ${oldStatus} → ${status}`, { oldStatus, status });
  return Document.findById(doc._id).populate('customer', 'name email company');
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return String(tags).split(',').map((t) => t.trim()).filter(Boolean);
}

function resolveDocumentStatus(type, status, metadata = {}) {
  if (type === 'invoice' && (metadata.paid || status === 'paid')) {
    return 'paid';
  }
  return status || getDefaultStatus(type);
}

function parseMetadataFromBody(type, body) {
  switch (type) {
    case 'contract':
      return {
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
        description: body.description,
      };
    case 'invoice':
      {
        const paid = body.paid === true || body.paid === 'true' || body.status === 'paid';
        return {
          invoiceForm: body.invoiceForm,
          invoiceSerial: body.invoiceSerial,
          invoiceType: body.invoiceType,
          createdDate: body.createdDate,
          issueDate: body.issueDate,
          dueDate: body.dueDate,
          amount: body.amount,
          vat: body.vat,
          discount: body.discount,
          total: body.total,
          paid,
          paidAmount: body.paidAmount,
          supplier: body.supplier,
          currency: body.currency,
        };
      }
    case 'quotation':
      return {
        createdDate: body.createdDate,
        validUntil: body.validUntil,
        amount: body.amount,
        vat: body.vat,
        discount: body.discount,
        total: body.total,
        manager: body.manager,
      };
    case 'appendix':
      return {
        effectiveDate: body.effectiveDate,
        description: body.description,
      };
    case 'acceptance_report':
      return {
        acceptanceDate: body.acceptanceDate,
        linkedContract: body.linkedContract,
      };
    case 'receipt':
    case 'payment_voucher':
      return {
        amount: body.amount,
        currency: body.currency,
        paymentMethod: body.paymentMethod,
        direction: body.direction,
        preparedBy: body.preparedBy,
        approvedBy: body.approvedBy,
        partyType: body.partyType,
        reason: body.reason,
        note: body.note,
      };
    default:
      return {};
  }
}

export function getContractEndDate(doc) {
  return doc.metadata?.endDate;
}

export function getContractRemindersSent(doc) {
  return doc.metadata?.remindersSent || [];
}

export async function pushContractReminder(doc, daysBeforeExpiry) {
  const reminders = getContractRemindersSent(doc);
  reminders.push({ daysBeforeExpiry, sentAt: new Date() });
  doc.metadata.remindersSent = reminders;
  await doc.save();
}

async function addVersionsForFiles(doc, user, files) {
  let versionNum = (doc.versions?.length || 0) + 1;
  for (const file of files) {
    doc.versions.push({
      version: versionNum,
      file,
      uploadedBy: user._id,
      ocrStatus: 'pending',
    });
    versionNum += 1;
  }
  await doc.save();
}

async function runOcrForNewVersions(documentId, count) {
  const doc = await Document.findById(documentId);
  if (!doc?.versions?.length) return;

  const newVersions = doc.versions.slice(-count);
  for (const version of newVersions) {
    await runOcrForVersion(documentId, version._id);
  }
}

export async function addDocumentVersion(id, user, file) {
  const doc = await Document.findById(id);
  if (!doc) return null;

  const [uploaded] = await uploadFiles([file]);
  const versionNum = (doc.versions?.length || 0) + 1;

  doc.versions.push({
    version: versionNum,
    file: uploaded,
    uploadedBy: user._id,
    ocrStatus: 'pending',
  });
  doc.files.push(uploaded);
  await doc.save();

  const newVersion = doc.versions[doc.versions.length - 1];
  await logActivity(doc._id, user._id, 'version_added', `Added version ${versionNum}`);
  runOcrForVersion(doc._id, newVersion._id).catch((err) => console.error('[OCR]', err.message));

  return Document.findById(doc._id)
    .populate('customer', 'name email company')
    .populate('versions.uploadedBy', 'name email');
}

export async function renameDocumentVersion(id, user, versionId, label) {
  const doc = await Document.findById(id);
  if (!doc) return null;

  const version = doc.versions.id(versionId);
  if (!version) return { notFound: true };

  version.label = String(label || '').trim();
  await doc.save();
  await logActivity(doc._id, user._id, 'updated', `Renamed version ${version.version}`);

  return Document.findById(doc._id)
    .populate('customer', 'name email company')
    .populate('versions.uploadedBy', 'name email');
}

export async function deleteDocumentVersion(id, user, versionId) {
  const doc = await Document.findById(id);
  if (!doc) return null;

  const version = doc.versions.id(versionId);
  if (!version) return { notFound: true };

  const storageKey = version.file?.storageKey;
  const fileUrl = version.file?.url;
  const filename = version.file?.filename;
  const versionNum = version.version;

  doc.versions.pull(versionId);
  doc.files = doc.files.filter((file) => {
    if (storageKey && file.storageKey === storageKey) return false;
    if (fileUrl && file.url === fileUrl) return false;
    if (filename && file.filename === filename) return false;
    return true;
  });

  await doc.save();
  await logActivity(doc._id, user._id, 'version_deleted', `Deleted version ${versionNum}`);

  return Document.findById(doc._id)
    .populate('customer', 'name email company')
    .populate('versions.uploadedBy', 'name email');
}
