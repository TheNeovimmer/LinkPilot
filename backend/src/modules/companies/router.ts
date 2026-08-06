import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  companyIdSchema,
  companyQuerySchema,
  createCompanySchema,
  updateCompanySchema,
} from './schema.js';
import { CompanyRepository } from './repository.js';
import { CompanyService } from './service.js';
import { CompanyController } from './controller.js';

const router = Router();
const controller = new CompanyController(new CompanyService(new CompanyRepository()));

router.use(requireAuth);

router.get('/', validate({ query: companyQuerySchema }), controller.list);
router.get('/all', controller.all);
router.post('/', validate({ body: createCompanySchema }), controller.create);
router.get('/:id', validate({ params: companyIdSchema }), controller.get);
router.patch('/:id', validate({ params: companyIdSchema, body: updateCompanySchema }), controller.update);
router.delete('/:id', validate({ params: companyIdSchema }), controller.remove);

export const companyRouter = router;
