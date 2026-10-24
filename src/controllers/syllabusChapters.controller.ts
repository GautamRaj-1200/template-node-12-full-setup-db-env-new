import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePositiveId } from '../utils/parsePositiveId.js';
import { listSyllabusChapters } from '../services/syllabusChapters.service.js';

export const getSyllabusChapters = asyncHandler(async (req, res) => {
  const sessionId = parsePositiveId(req.query.sessionId, 'session ID');
  const subjectId = parsePositiveId(req.query.subjectId, 'subject ID');
  const chapters = await listSyllabusChapters(sessionId, subjectId);

  res.status(200).json(ApiResponse.success(chapters, 'Syllabus chapters fetched successfully'));
});
