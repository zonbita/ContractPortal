import { Conversation, conversationKey } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

export async function findOrCreateConversation(a, b) {
  const key = conversationKey(a, b);
  let convo = await Conversation.findOne({ key });
  if (!convo) {
    convo = await Conversation.create({ participants: [a, b], key });
  }
  return convo;
}

export async function saveMessage(senderId, recipientId, content) {
  const text = String(content || '').trim();
  if (!text) throw new Error('Empty message');

  const convo = await findOrCreateConversation(senderId, recipientId);
  const message = await Message.create({
    conversation: convo._id,
    sender: senderId,
    recipient: recipientId,
    content: text,
  });

  convo.lastMessage = text;
  convo.lastMessageAt = message.createdAt;
  convo.lastSender = senderId;
  await convo.save();

  return Message.findById(message._id)
    .populate('sender', 'name email role')
    .populate('recipient', 'name email role');
}

export async function listChatUsers(userId) {
  return User.find({ _id: { $ne: userId }, isActive: true })
    .select('name email role')
    .sort({ name: 1 });
}

export async function listConversations(userId) {
  const convos = await Conversation.find({ participants: userId })
    .populate('participants', 'name email role')
    .sort({ lastMessageAt: -1 });

  const result = [];
  for (const c of convos) {
    const other = c.participants.find((p) => String(p._id) !== String(userId));
    const unread = await Message.countDocuments({
      conversation: c._id,
      recipient: userId,
      read: false,
    });
    result.push({
      _id: c._id,
      user: other,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      lastSender: c.lastSender,
      unread,
    });
  }
  return result;
}

export async function getMessagesWith(userId, otherId) {
  const convo = await findOrCreateConversation(userId, otherId);
  const messages = await Message.find({ conversation: convo._id })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email role')
    .populate('recipient', 'name email role');
  return { conversation: convo, messages };
}

export async function markConversationRead(userId, otherId) {
  const convo = await Conversation.findOne({ key: [String(userId), String(otherId)].sort().join(':') });
  if (!convo) return 0;
  const res = await Message.updateMany(
    { conversation: convo._id, recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
  return res.modifiedCount || 0;
}

export async function countUnread(userId) {
  return Message.countDocuments({ recipient: userId, read: false });
}

export async function deleteMessage(messageId, userId) {
  const msg = await Message.findById(messageId);
  if (!msg) return null;
  if (String(msg.sender) !== String(userId)) return null;

  const conversationId = msg.conversation;
  const recipientId = String(msg.recipient);
  await Message.deleteOne({ _id: messageId });

  const last = await Message.findOne({ conversation: conversationId }).sort({ createdAt: -1 });
  const convo = await Conversation.findById(conversationId);
  if (convo) {
    convo.lastMessage = last?.content || '';
    convo.lastMessageAt = last?.createdAt || convo.updatedAt;
    convo.lastSender = last?.sender || null;
    await convo.save();
  }

  return {
    messageId: String(messageId),
    conversationId: String(conversationId),
    recipientId,
    senderId: String(userId),
  };
}
