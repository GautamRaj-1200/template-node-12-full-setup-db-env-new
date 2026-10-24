import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { parsePositiveId } from '../utils/parsePositiveId.js';
import { listAcademicSessionsByBoard } from '../services/academicSessions.service.js';

export const getAcademicSessions = asyncHandler(async (req, res) => {
  const boardId = parsePositiveId(req.query.boardId, 'board ID');
  const academicSessions = await listAcademicSessionsByBoard(boardId);

  res
    .status(200)
    .json(ApiResponse.success(academicSessions, 'Academic sessions fetched successfully'));
});
