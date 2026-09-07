-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Recruiter" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "orgId" TEXT;

-- CreateIndex
CREATE INDEX "Application_orgId_idx" ON "Application"("orgId");

-- CreateIndex
CREATE INDEX "Attachment_orgId_idx" ON "Attachment"("orgId");

-- CreateIndex
CREATE INDEX "Company_orgId_idx" ON "Company"("orgId");

-- CreateIndex
CREATE INDEX "Conversation_orgId_idx" ON "Conversation"("orgId");

-- CreateIndex
CREATE INDEX "Interview_orgId_idx" ON "Interview"("orgId");

-- CreateIndex
CREATE INDEX "Job_orgId_idx" ON "Job"("orgId");

-- CreateIndex
CREATE INDEX "Note_orgId_idx" ON "Note"("orgId");

-- CreateIndex
CREATE INDEX "Notification_orgId_idx" ON "Notification"("orgId");

-- CreateIndex
CREATE INDEX "Recruiter_orgId_idx" ON "Recruiter"("orgId");

-- CreateIndex
CREATE INDEX "Reminder_orgId_idx" ON "Reminder"("orgId");
