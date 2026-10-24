import { Router } from 'express';
import { getSyllabusChapters } from '../controllers/syllabusChapters.controller.js';

const router: Router = Router();

router.get('/', getSyllabusChapters);

export default router;
