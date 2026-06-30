import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

commentSchema.index({ document: 1, createdAt: -1 });

export const Comment = mongoose.model('Comment', commentSchema);
