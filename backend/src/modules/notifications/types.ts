import type { Notification } from '@prisma/client';

export type NotificationDTO = Notification;

export type NotificationType = 'REMINDER' | 'INTERVIEW' | 'APPLICATION' | 'AI' | 'SYSTEM';
