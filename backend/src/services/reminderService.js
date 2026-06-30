import { Document } from '../models/Document.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendEmail, buildExpirationEmail } from './emailService.js';
import {
  getContractEndDate,
  getContractRemindersSent,
  pushContractReminder,
  toContractResponse,
} from './adapters/contractAdapter.js';

export const REMINDER_DAYS = [30, 15, 7, 1];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(from, to) {
  const ms = startOfDay(to) - startOfDay(from);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function hasReminderBeenSent(doc, daysBeforeExpiry) {
  return getContractRemindersSent(doc).some((r) => r.daysBeforeExpiry === daysBeforeExpiry);
}

async function notifyStaff(doc, daysLeft) {
  const staffUsers = await User.find({
    role: { $in: ['admin', 'manager', 'staff'] },
    isActive: true,
  });

  const contractView = toContractResponse(doc);
  const title = `Hợp đồng sắp hết hạn (${daysLeft} ngày)`;
  const message = `${doc.documentNumber} - ${doc.title} sẽ hết hạn sau ${daysLeft} ngày.`;

  const notifications = staffUsers.map((user) => ({
    user: user._id,
    type: 'expiration_reminder',
    title,
    message,
    contract: doc._id,
    metadata: { daysLeft, documentType: 'contract' },
  }));

  await Notification.insertMany(notifications);

  const emailContent = buildExpirationEmail({ contract: contractView, daysLeft });
  for (const user of staffUsers) {
    await sendEmail({ to: user.email, ...emailContent });
  }
}

async function processContractReminder(doc, today) {
  const endDate = getContractEndDate(doc);
  if (!endDate) return false;

  const daysLeft = daysBetween(today, endDate);
  if (!REMINDER_DAYS.includes(daysLeft)) return false;
  if (hasReminderBeenSent(doc, daysLeft)) return false;

  await notifyStaff(doc, daysLeft);
  await pushContractReminder(doc, daysLeft);
  return true;
}

async function markExpiredContracts(today) {
  await Document.updateMany(
    {
      type: 'contract',
      'metadata.endDate': { $lt: today },
      status: { $in: ['in_progress', 'signed', 'active'] },
    },
    { status: 'expired' }
  );
}

export async function runExpirationReminders() {
  const today = startOfDay(new Date());
  await markExpiredContracts(today);

  const contracts = await Document.find({
    type: 'contract',
    status: { $in: ['in_progress', 'signed', 'active', 'pending'] },
    'metadata.endDate': { $gte: today },
  }).populate('customer');

  let sent = 0;
  for (const doc of contracts) {
    const processed = await processContractReminder(doc, today);
    if (processed) sent += 1;
  }

  console.log(`[Reminder Cron] Processed ${contracts.length} contracts, sent ${sent} reminders`);
  return { processed: contracts.length, sent };
}
