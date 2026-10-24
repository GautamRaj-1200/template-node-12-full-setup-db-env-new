import { Router } from 'express';
import { getSubjects } from '../controllers/subjects.controller.js';

const router: Router = Router();

router.get('/', getSubjects);

export default router;
