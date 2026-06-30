import mongoose from 'mongoose';
import { DOCUMENT_TYPES, STATUS_BY_TYPE, buildSearchText } from '../schemas/documentMetadata.js';

const fileSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    storageKey: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const versionSchema = new mongoose.Schema(
  {
    version: Number,
    label: { type: String, trim: true, default: '' },
    file: fileSchema,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ocrText: { type: String, default: '' },
    ocrStatus: { type: String, enum: ['pending', 'processing', 'done', 'failed', 'skipped'], default: 'pending' },
    ocr: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: DOCUMENT_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    documentNumber: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    status: { type: String, default: 'draft' },
    description: { type: String, trim: true, default: '' },
    tags: [{ type: String, trim: true }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    files: [fileSchema],
    versions: [versionSchema],
    ocrText: { type: String, default: '' },
    ocrStatus: { type: String, enum: ['pending', 'processing', 'done', 'failed', 'skipped'], default: 'pending' },
    parentDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    legacyId: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    searchText: { type: String, default: '', index: 'text' },
  },
  { timestamps: true }
);

documentSchema.index({ type: 1, documentNumber: 1 });
documentSchema.index({ customer: 1, type: 1 });
documentSchema.index({ type: 1, status: 1 });
documentSchema.index({ 'metadata.endDate': 1 });
documentSchema.index({ 'metadata.dueDate': 1 });
documentSchema.index({ parentDocument: 1 });

documentSchema.pre('save', async function updateSearchText() {
  this.searchText = buildSearchText(this);
});

export const Document = mongoose.model('Document', documentSchema);
export { DOCUMENT_TYPES, STATUS_BY_TYPE };
