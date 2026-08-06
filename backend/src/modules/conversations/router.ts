import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  conversationIdSchema,
  conversationQuerySchema,
  createConversationSchema,
  updateConversationSchema,
} from './schema.js';
import { ConversationRepository } from './repository.js';
import { ConversationService } from './service.js';
import { ConversationController } from './controller.js';

const router = Router();
const controller = new ConversationController(new ConversationService(new ConversationRepository()));

router.use(requireAuth);

router.get('/', validate({ query: conversationQuerySchema }), controller.list);
router.post('/', validate({ body: createConversationSchema }), controller.create);
router.get('/:id', validate({ params: conversationIdSchema }), controller.get);
router.patch('/:id', validate({ params: conversationIdSchema, body: updateConversationSchema }), controller.update);
router.delete('/:id', validate({ params: conversationIdSchema }), controller.remove);

export const conversationRouter = router;
