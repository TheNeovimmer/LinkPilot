import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { updateProfileSchema } from './schema.js';
import { ProfileRepository } from './repository.js';
import { UserService } from './service.js';
import { UserController } from './controller.js';

const router = Router();
const controller = new UserController(new UserService(new ProfileRepository()));

router.use(requireAuth);
router.get('/me', controller.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), controller.patchMe);
router.post('/me/avatar', controller.uploadAvatar);
router.delete('/me', controller.deleteMe);
router.get('/export', controller.exportData);

export const userRouter = router;
