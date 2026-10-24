import { Router } from 'express';
import { getBoards } from '../controllers/boards.controllers.js';
const router: Router = Router();

// Get all boards
router.get('/', getBoards);

export default router;
