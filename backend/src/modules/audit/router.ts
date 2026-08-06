import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { auditQuerySchema } from './schema.js';
import { auditService } from './service.js';
import { AuditController } from './controller.js';

const router = Router();
const controller = new AuditController(auditService);

router.use(requireAuth);
router.get('/', validate({ query: auditQuerySchema }), controller.list);

export const auditRouter = router;
