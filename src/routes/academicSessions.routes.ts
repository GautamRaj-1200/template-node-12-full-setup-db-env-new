import { Router } from 'express';
import { getAcademicSessions } from '../controllers/academicSessions.controllers.js';

const router: Router = Router();

router.get('/', getAcademicSessions);

export default router;
