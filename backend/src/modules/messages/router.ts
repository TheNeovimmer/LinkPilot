import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  createMessageSchema,
  messageIdParamsSchema,
  messageListQuerySchema,
  replaceMessageSchema,
} from './schema.js';
import { MessageRepository } from './repository.js';
import { MessageService } from './service.js';
import { MessageController } from './controller.js';
import { ConversationRepository } from '../conversations/repository.js';

const router = Router({ mergeParams: true });
const controller = new MessageController(
  new MessageService(new MessageRepository(), new ConversationRepository()),
);

router.use(requireAuth);

router.get('/', validate({ query: messageListQuerySchema }), controller.list);
router.post('/', validate({ body: createMessageSchema }), controller.create);
router.patch('/:id', validate({ params: messageIdParamsSchema, body: replaceMessageSchema }), controller.update);
router.delete('/:id', validate({ params: messageIdParamsSchema }), controller.remove);

export const messageRouter = router;
