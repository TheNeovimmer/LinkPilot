import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  createInterviewSchema,
  interviewIdSchema,
  interviewQuerySchema,
  updateInterviewSchema,
} from './schema.js';
import { InterviewRepository } from './repository.js';
import { InterviewService } from './service.js';
import { InterviewController } from './controller.js';

const router = Router();
const controller = new InterviewController(new InterviewService(new InterviewRepository()));

router.use(requireAuth);

router.get('/', validate({ query: interviewQuerySchema }), controller.list);
router.get('/upcoming', controller.upcoming);
router.post('/', validate({ body: createInterviewSchema }), controller.create);
router.get('/:id', validate({ params: interviewIdSchema }), controller.get);
router.patch('/:id', validate({ params: interviewIdSchema, body: updateInterviewSchema }), controller.update);
router.delete('/:id', validate({ params: interviewIdSchema }), controller.remove);

export const interviewRouter = router;
