import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { listActiveBoards } from '../services/boards.service.js';

export const getBoards = asyncHandler(async (_req, res) => {
  const boards = await listActiveBoards();

  res.status(200).json(ApiResponse.success(boards, 'Academic boards fetched successfully'));
});
