import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UserService } from './service.js';

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
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(ApiError.badRequest('Only image uploads are allowed'));
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

  /** POST /me/avatar — multipart/form-data, field "file". */
  uploadAvatar = [
    upload.single('file'),
    asyncHandler(async (req, res) => {
      if (!req.file) throw ApiError.badRequest('No file uploaded');
      const url = `/uploads/${req.file.filename}`;
      const profile = await this.service.updateAvatar(req.user!.id, url);
      ok(res, profile);
    }),
  ];
}
