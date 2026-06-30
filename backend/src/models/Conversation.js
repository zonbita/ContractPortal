import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    key: { type: String, required: true, unique: true, index: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export function conversationKey(a, b) {
  return [String(a), String(b)].sort().join(':');
}

export const Conversation = mongoose.model('Conversation', conversationSchema);
