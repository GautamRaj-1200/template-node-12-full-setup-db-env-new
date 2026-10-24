import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { parsePositiveId } from '../utils/parsePositiveId.js';
import { listClassesByBoard } from '../services/classes.service.js';

export const getClasses = asyncHandler(async (req, res) => {
  const boardId = parsePositiveId(req.query.boardId, 'board ID');
  const classes = await listClassesByBoard(boardId);

  res.status(200).json(ApiResponse.success(classes, 'Classes fetched successfully'));
});
