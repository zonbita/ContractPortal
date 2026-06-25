import { Contract } from '../models/Contract.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendEmail, buildExpirationEmail } from './emailService.js';

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

function hasReminderBeenSent(contract, daysBeforeExpiry) {
  return contract.remindersSent?.some((r) => r.daysBeforeExpiry === daysBeforeExpiry);
}

async function notifyStaff(contract, daysLeft) {
  const staffUsers = await User.find({
    role: { $in: ['admin', 'manager', 'staff'] },
    isActive: true,
  });

  const title = `Hợp đồng sắp hết hạn (${daysLeft} ngày)`;
  const message = `${contract.contractNumber} - ${contract.title} sẽ hết hạn sau ${daysLeft} ngày.`;

  const notifications = staffUsers.map((user) => ({
    user: user._id,
    type: 'expiration_reminder',
    title,
    message,
    contract: contract._id,
    metadata: { daysLeft },
  }));

  await Notification.insertMany(notifications);

  const emailContent = buildExpirationEmail({ contract, daysLeft: daysLeft });
  for (const user of staffUsers) {
    await sendEmail({ to: user.email, ...emailContent });
  }
}

async function processContractReminder(contract, today) {
  const daysLeft = daysBetween(today, contract.endDate);
  if (!REMINDER_DAYS.includes(daysLeft)) return false;
  if (hasReminderBeenSent(contract, daysLeft)) return false;

  await notifyStaff(contract, daysLeft);

  contract.remindersSent = contract.remindersSent || [];
  contract.remindersSent.push({ daysBeforeExpiry: daysLeft, sentAt: new Date() });
  await contract.save();
  return true;
}

async function markExpiredContracts(today) {
  await Contract.updateMany(
    { endDate: { $lt: today }, status: 'active' },
    { status: 'expired' }
  );
}

export async function runExpirationReminders() {
  const today = startOfDay(new Date());
  await markExpiredContracts(today);

  const contracts = await Contract.find({
    status: { $in: ['active', 'pending'] },
    endDate: { $gte: today },
  }).populate('customer');

  let sent = 0;
  for (const contract of contracts) {
    const processed = await processContractReminder(contract, today);
    if (processed) sent += 1;
  }

  console.log(`[Reminder Cron] Processed ${contracts.length} contracts, sent ${sent} reminders`);
  return { processed: contracts.length, sent };
}
