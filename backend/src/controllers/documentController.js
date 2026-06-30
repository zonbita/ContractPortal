import {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  updateDocumentStatus,
  addDocumentVersion,
  deleteDocumentVersion,
  renameDocumentVersion,
} from '../services/documentService.js';
import { searchDocuments } from '../services/searchService.js';
import { runOcrForDocument, runOcrForVersion } from '../services/ocrService.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Comment } from '../models/Comment.js';
import { Document } from '../models/Document.js';
import { logActivity } from '../services/documentService.js';

export const getDocuments = async (req, res) => {
  const docs = await listDocuments(req.user, req.query);
  res.json(docs);
};

export const getDocument = async (req, res) => {
  const result = await getDocumentById(req.params.id, req.user);
  if (!result) return res.status(404).json({ message: 'Document not found' });
  if (result.forbidden) return res.status(403).json({ message: 'Access denied' });
  res.json(result);
};

export const createDocumentHandler = async (req, res) => {
  try {
    const doc = await createDocument(req.user, req.body, req.files);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateDocumentHandler = async (req, res) => {
  try {
    const doc = await updateDocument(req.params.id, req.user, req.body, req.files);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteDocumentHandler = async (req, res) => {
  const doc = await deleteDocument(req.params.id, req.user);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json({ message: 'Document deleted' });
};

export const updateDocumentStatusHandler = async (req, res) => {
  const doc = await updateDocumentStatus(req.params.id, req.user, req.body.status);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json(doc);
};

export const updateVersionOcrMetadataHandler = async (req, res) => {
  const result = await getDocumentById(req.params.id, req.user);
  if (!result) return res.status(404).json({ message: 'Document not found' });
  if (result.forbidden) return res.status(403).json({ message: 'Access denied' });

  const doc = await Document.findById(req.params.id);
  const version = doc.versions.id(req.params.versionId);
  if (!version) return res.status(404).json({ message: 'Version not found' });

  const ocr = req.body.ocr || {};
  version.ocr = {
    ...(version.ocr || {}),
    ...ocr,
    updatedAt: new Date(),
  };

  if (doc.type === 'invoice') {
    if (ocr.invoiceName) doc.title = ocr.invoiceName;
    doc.metadata = {
      ...(doc.metadata || {}),
      ocr: version.ocr,
    };
    if (ocr.seller) doc.metadata.supplier = ocr.seller;
    if (ocr.totalAmount !== undefined) doc.metadata.amount = Number(ocr.totalAmount) || 0;
  }

  await doc.save();
  await logActivity(doc._id, req.user._id, 'ocr_metadata_updated', `Updated OCR data for version ${version.version}`);
  const updated = await getDocumentById(req.params.id, req.user);
  res.json(updated);
};

export const updateOcrMetadataHandler = async (req, res) => {
  const result = await getDocumentById(req.params.id, req.user);
  if (!result) return res.status(404).json({ message: 'Document not found' });
  if (result.forbidden) return res.status(403).json({ message: 'Access denied' });

  const ocr = req.body.ocr || {};
  const doc = await Document.findById(req.params.id);
  doc.metadata = {
    ...(doc.metadata || {}),
    ocr: {
      ...(doc.metadata?.ocr || {}),
      ...ocr,
      updatedAt: new Date(),
    },
  };

  if (doc.type === 'invoice') {
    if (ocr.invoiceName) doc.title = ocr.invoiceName;
    if (ocr.seller) doc.metadata.supplier = ocr.seller;
    if (ocr.totalAmount !== undefined) doc.metadata.amount = Number(ocr.totalAmount) || 0;
  }

  await doc.save();
  await logActivity(doc._id, req.user._id, 'ocr_metadata_updated', 'Updated OCR extracted data');
  const updated = await getDocumentById(req.params.id, req.user);
  res.json(updated);
};

export const searchDocumentsHandler = async (req, res) => {
  const results = await searchDocuments(req.user, req.query);
  res.json(results);
};

export const runVersionOcrHandler = async (req, res) => {
  try {
    const result = await getDocumentById(req.params.id, req.user);
    if (!result) return res.status(404).json({ message: 'Document not found' });
    if (result.forbidden) return res.status(403).json({ message: 'Access denied' });

    const text = await runOcrForVersion(req.params.id, req.params.versionId, { provider: req.body.provider });
    const updated = await getDocumentById(req.params.id, req.user);
    const version = updated.versions.find((item) => String(item._id) === String(req.params.versionId));
    res.json({
      ocrText: text,
      status: version?.ocrStatus || updated.ocrStatus,
      ocr: version?.ocr || {},
      metadata: updated.metadata,
      title: updated.title,
      version,
    });
  } catch (err) {
    if (err.status === 429 || err.code === 'insufficient_quota') {
      return res.status(402).json({ message: 'OpenAI API key đã hết quota hoặc chưa bật billing. Vui lòng kiểm tra billing/quota hoặc dùng OCR thường.' });
    }
    if (err.status === 401) {
      return res.status(401).json({ message: 'OpenAI API key không hợp lệ. Vui lòng kiểm tra OPENAI_API_KEY.' });
    }
    res.status(500).json({ message: err.message });
  }
};

export const runOcrHandler = async (req, res) => {
  try {
    const result = await getDocumentById(req.params.id, req.user);
    if (!result) return res.status(404).json({ message: 'Document not found' });
    if (result.forbidden) return res.status(403).json({ message: 'Access denied' });
    const text = await runOcrForDocument(req.params.id, { provider: req.body.provider });
    const updated = await getDocumentById(req.params.id, req.user);
    res.json({ ocrText: text, status: updated.ocrStatus, metadata: updated.metadata, title: updated.title });
  } catch (err) {
    if (err.status === 429 || err.code === 'insufficient_quota') {
      return res.status(402).json({ message: 'OpenAI API key đã hết quota hoặc chưa bật billing. Vui lòng kiểm tra billing/quota hoặc dùng OCR thường.' });
    }
    if (err.status === 401) {
      return res.status(401).json({ message: 'OpenAI API key không hợp lệ. Vui lòng kiểm tra OPENAI_API_KEY.' });
    }
    res.status(500).json({ message: err.message });
  }
};

export const getActivityLogs = async (req, res) => {
  const logs = await ActivityLog.find({ document: req.params.id })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(logs);
};

export const getComments = async (req, res) => {
  const comments = await Comment.find({ document: req.params.id })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(comments);
};

export const addComment = async (req, res) => {
  const result = await getDocumentById(req.params.id, req.user);
  if (!result) return res.status(404).json({ message: 'Document not found' });
  if (result.forbidden) return res.status(403).json({ message: 'Access denied' });

  const comment = await Comment.create({
    document: req.params.id,
    user: req.user._id,
    text: req.body.text,
  });
  await logActivity(req.params.id, req.user._id, 'comment_added', 'Comment added');
  const populated = await Comment.findById(comment._id).populate('user', 'name email');
  res.status(201).json(populated);
};

export const deleteComment = async (req, res) => {
  const comment = await Comment.findOneAndDelete({ _id: req.params.commentId, document: req.params.id });
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  res.json({ message: 'Comment deleted' });
};

export const addVersionHandler = async (req, res) => {
  try {
    const result = await getDocumentById(req.params.id, req.user);
    if (!result) return res.status(404).json({ message: 'Document not found' });
    if (result.forbidden) return res.status(403).json({ message: 'Access denied' });
    if (!req.file) return res.status(400).json({ message: 'File is required' });

    const doc = await addDocumentVersion(req.params.id, req.user, req.file);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const renameVersionHandler = async (req, res) => {
  try {
    const result = await getDocumentById(req.params.id, req.user);
    if (!result) return res.status(404).json({ message: 'Document not found' });
    if (result.forbidden) return res.status(403).json({ message: 'Access denied' });

    const doc = await renameDocumentVersion(req.params.id, req.user, req.params.versionId, req.body.label);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.notFound) return res.status(404).json({ message: 'Version not found' });

    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteVersionHandler = async (req, res) => {
  try {
    const result = await getDocumentById(req.params.id, req.user);
    if (!result) return res.status(404).json({ message: 'Document not found' });
    if (result.forbidden) return res.status(403).json({ message: 'Access denied' });

    const doc = await deleteDocumentVersion(req.params.id, req.user, req.params.versionId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.notFound) return res.status(404).json({ message: 'Version not found' });

    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
