import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, required: true, default: Date.now },
    method: { type: String, trim: true, default: '' },
    reference: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ contract: 1, paidAt: -1 });
paymentSchema.index({ customer: 1, paidAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
