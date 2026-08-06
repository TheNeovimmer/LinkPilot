import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  createRecruiterSchema,
  recruiterIdSchema,
  recruiterQuerySchema,
  updateRecruiterSchema,
} from './schema.js';
import { RecruiterRepository } from './repository.js';
import { RecruiterService } from './service.js';
import { RecruiterController } from './controller.js';

const router = Router();
const controller = new RecruiterController(new RecruiterService(new RecruiterRepository()));

router.use(requireAuth);

router.get('/', validate({ query: recruiterQuerySchema }), controller.list);
router.get('/pipeline', controller.pipeline);
router.post('/', validate({ body: createRecruiterSchema }), controller.create);
router.get('/:id', validate({ params: recruiterIdSchema }), controller.get);
router.patch('/:id', validate({ params: recruiterIdSchema, body: updateRecruiterSchema }), controller.update);
router.delete('/:id', validate({ params: recruiterIdSchema }), controller.remove);

export const recruiterRouter = router;
