import mongoose from 'mongoose';

export const CONTRACT_STATUSES = ['draft', 'pending', 'active', 'expired', 'terminated'];

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

const contractSchema = new mongoose.Schema(
  {
    contractNumber: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    value: { type: Number, default: 0 },
    status: { type: String, enum: CONTRACT_STATUSES, default: 'draft' },
    description: { type: String, trim: true },
    files: [fileSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remindersSent: [{ daysBeforeExpiry: Number, sentAt: Date }],
  },
  { timestamps: true }
);

contractSchema.index({ endDate: 1, status: 1 });
contractSchema.index({ contractNumber: 1 });

export const Contract = mongoose.model('Contract', contractSchema);
