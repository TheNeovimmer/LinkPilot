import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/database/prisma';
import { getUploadRoot } from '../src/lib/storage';

/** One-shot migration: copy legacy UPLOAD_DIR files into DB byte columns. Idempotent. */
async function main() {
  const root = getUploadRoot();
  if (!fs.existsSync(root)) {
    console.log(`No upload dir at ${root}, nothing to migrate`);
    return;
  }
  const files = fs.readdirSync(root);
  let attachments = 0;
  let avatars = 0;
  for (const filename of files) {
    const full = path.join(root, filename);
    if (!fs.statSync(full).isFile()) continue;
    const buf = fs.readFileSync(full);
    const url = `/uploads/${filename}`;
    const att = await prisma.attachment.findFirst({ where: { OR: [{ filename }, { url }], data: null }, select: { id: true } });
    if (att) {
      await prisma.attachment.update({ where: { id: att.id }, data: { data: buf, size: buf.byteLength } });
      attachments++;
      continue;
    }
    const user = await prisma.user.findFirst({ where: { image: url, avatarData: null }, select: { id: true } });
    if (user) {
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
      await prisma.user.update({ where: { id: user.id }, data: { avatarData: buf, avatarMime: mime } });
      avatars++;
    }
  }
  console.log(`Migrated ${attachments} attachments and ${avatars} avatars from ${root} into the database`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
