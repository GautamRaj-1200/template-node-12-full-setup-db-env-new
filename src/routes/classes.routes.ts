import { Router } from 'express';
import { getClasses } from '../controllers/classes.controllers.js';

const router: Router = Router();

router.get('/', getClasses);

export default router;
