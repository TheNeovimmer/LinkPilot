import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UserService } from './service.js';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

/** Sniff real content, never trust the client-supplied mimetype. */
function sniffImage(buf: Buffer, mimetype: string): boolean {
  if (mimetype === 'image/png') return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimetype === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mimetype === 'image/gif') return buf.length > 6 && (buf.subarray(0, 6).toString('ascii') === 'GIF87a' || buf.subarray(0, 6).toString('ascii') === 'GIF89a');
  if (mimetype === 'image/webp') return buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
    else cb(ApiError.badRequest('Only PNG, JPEG, WebP or GIF images are allowed'));
  },
});

export class UserController {
  constructor(private readonly service: UserService) {}

  getMe = asyncHandler(async (req, res) => {
    const profile = await this.service.getProfile(req.user!.id);
    ok(res, profile);
  });

  patchMe = asyncHandler(async (req, res) => {
    const profile = await this.service.updateProfile(req.user!.id, req.body);
    ok(res, profile);
  });

  deleteMe = asyncHandler(async (req, res) => {
    await this.service.deleteAccount(req.user!.id);
    res.status(204).send();
  });

  /** GET /export — full JSON backup of the user's data (download). */
  exportData = asyncHandler(async (req, res) => {
    const data = await this.service.exportData(req.user!.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="linkpilot-export-${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(JSON.stringify(data, null, 2));
  });

  /** POST /me/avatar — multipart/form-data, field "file". */
  uploadAvatar = [
    upload.single('file'),
    asyncHandler(async (req, res) => {
      if (!req.file) throw ApiError.badRequest('No file uploaded');
      const buf = fs.readFileSync(req.file.path);
      if (!sniffImage(buf, req.file.mimetype)) {
        fs.unlink(req.file.path, () => {});
        throw ApiError.badRequest('File is not a valid image');
      }
      const url = `/uploads/${req.file.filename}`;
      const profile = await this.service.updateAvatar(req.user!.id, url);
      // Remove the previous avatar file so uploads don't accumulate.
      if (profile.image && profile.image !== url) {
        const old = path.resolve(env.UPLOAD_DIR, path.basename(profile.image));
        if (old.startsWith(path.resolve(env.UPLOAD_DIR)) && old !== req.file.path) {
          fs.unlink(old, () => {});
        }
      }
      ok(res, profile);
    }),
  ];
}
