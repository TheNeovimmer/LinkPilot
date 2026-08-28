import cron from 'node-cron';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { notificationService } from '../modules/notifications/service';
import { ReminderRepository } from '../modules/reminders/repository';
import { auditService } from '../modules/audit/service';
import '../server/realtime'; // wire the notification publisher

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

/** Every minute: notify once per interview scheduled within the next 24h. */
function startInterviewReminderWorker(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const horizon = new Date(now.getTime() + 24 * 3_600_000);
      const interviews = await prisma.interview.findMany({
        where: { status: 'SCHEDULED', remindedAt: null, scheduledAt: { gte: now, lte: horizon } },
        select: { id: true, userId: true, title: true, job: { select: { company: { select: { name: true } } } } },
      });
      for (const interview of interviews) {
        await notificationService.create({
          userId: interview.userId,
          type: 'INTERVIEW',
          title: `Coming up: ${interview.title}`,
          body: `Scheduled within the next 24h${interview.job?.company?.name ? ` at ${interview.job.company.name}` : ''}`,
          data: { interviewId: interview.id },
        });
        await prisma.interview.update({ where: { id: interview.id }, data: { remindedAt: now } });
        await auditService.log(interview.userId, 'interview.reminder', 'interview', interview.id);
      }
    } catch (err) {
      logger.error('Interview reminder worker failed', err);
    }
  });
  logger.info('Interview reminder worker started (every minute)');
}

const started = globalThis as unknown as { __linkpilotWorkersStarted?: boolean };

export function startWorkers(): void {
  if (process.env.NODE_ENV === 'test') return;
  if (started.__linkpilotWorkersStarted) return;
  started.__linkpilotWorkersStarted = true;
  startReminderWorker();
  startInterviewReminderWorker();
}
