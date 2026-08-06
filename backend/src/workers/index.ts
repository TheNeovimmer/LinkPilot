import cron from 'node-cron';
import { prisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';
import { notificationService } from '../modules/notifications/service.js';
import { ReminderRepository } from '../modules/reminders/repository.js';
import { auditService } from '../modules/audit/service.js';

const reminders = new ReminderRepository();

/** Every minute: turn due reminders into notifications (once per reminder). */
function startReminderWorker(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const users = await prisma.user.findMany({ select: { id: true } });

      for (const user of users) {
        const due = await reminders.dueNow(user.id, now);
        for (const reminder of due) {
          await notificationService.create({
            userId: user.id,
            type: 'REMINDER',
            title: `Reminder: ${reminder.title}`,
            body: reminder.body ?? undefined,
            data: { reminderId: reminder.id, dueAt: reminder.dueAt.toISOString() },
          });
          await reminders.markReminded(reminder.id, now);
          await auditService.log(user.id, 'reminder.due', 'reminder', reminder.id);
        }
      }
    } catch (err) {
      logger.error('Reminder worker failed', err);
    }
  });
  logger.info('Reminder worker started (every minute)');
}

export function startWorkers(): void {
  if (process.env.NODE_ENV === 'test') return;
  startReminderWorker();
}
