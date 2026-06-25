import cron from 'node-cron';
import { runExpirationReminders } from '../services/reminderService.js';

export function startReminderCron() {
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      await runExpirationReminders();
    } catch (err) {
      console.error('[Reminder Cron] Error:', err.message);
    }
  });
  console.log('Reminder cron job scheduled (daily at 8:00 AM)');
}
