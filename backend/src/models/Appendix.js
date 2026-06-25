import mongoose from 'mongoose';

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

const appendixSchema = new mongoose.Schema(
  {
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    effectiveDate: { type: Date },
    files: [fileSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

appendixSchema.index({ contract: 1 });

export const Appendix = mongoose.model('Appendix', appendixSchema);
