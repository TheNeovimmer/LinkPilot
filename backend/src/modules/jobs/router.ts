import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  createJobSchema,
  jobIdSchema,
  jobQuerySchema,
  semanticSearchSchema,
  updateJobSchema,
} from './schema.js';
import { JobRepository } from './repository.js';
import { JobService } from './service.js';
import { JobController } from './controller.js';

const router = Router();
const controller = new JobController(new JobService(new JobRepository()));

router.use(requireAuth);

router.get('/', validate({ query: jobQuerySchema }), controller.list);
router.post('/', validate({ body: createJobSchema }), controller.create);
router.get('/stats', controller.stats);
router.post('/semantic', validate({ body: semanticSearchSchema }), controller.semantic);
router.get('/:id', validate({ params: jobIdSchema }), controller.get);
router.patch('/:id', validate({ params: jobIdSchema, body: updateJobSchema }), controller.update);
router.delete('/:id', validate({ params: jobIdSchema }), controller.remove);

export const jobRouter = router;
