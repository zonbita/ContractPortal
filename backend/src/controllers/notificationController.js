import { Notification } from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate('contract', 'contractNumber title endDate')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
};

export const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
};

export const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
};

export const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ count });
};
