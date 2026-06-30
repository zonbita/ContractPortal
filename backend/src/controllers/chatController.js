import {
  listChatUsers,
  listConversations,
  getMessagesWith,
  markConversationRead,
  saveMessage,
  countUnread,
} from '../services/chatService.js';

export const getUsers = async (req, res) => {
  const users = await listChatUsers(req.user._id);
  res.json(users);
};

export const getConversations = async (req, res) => {
  const conversations = await listConversations(req.user._id);
  res.json(conversations);
};

export const getMessages = async (req, res) => {
  const { userId } = req.params;
  const { messages } = await getMessagesWith(req.user._id, userId);
  await markConversationRead(req.user._id, userId);
  res.json(messages);
};

export const postMessage = async (req, res) => {
  const { userId } = req.params;
  const message = await saveMessage(req.user._id, userId, req.body.content);
  res.status(201).json(message);
};

export const markRead = async (req, res) => {
  const { userId } = req.params;
  const count = await markConversationRead(req.user._id, userId);
  res.json({ marked: count });
};

export const getUnreadCount = async (req, res) => {
  const count = await countUnread(req.user._id);
  res.json({ count });
};
