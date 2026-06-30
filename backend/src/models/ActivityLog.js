import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'deleted',
        'status_changed',
        'file_uploaded',
        'ocr_completed',
        'ocr_metadata_updated',
        'comment_added',
        'version_added',
        'version_deleted',
        'payment_added',
        'payment_deleted',
      ],
      required: true,
    },
    description: { type: String, trim: true },
    diff: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

activityLogSchema.index({ document: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
