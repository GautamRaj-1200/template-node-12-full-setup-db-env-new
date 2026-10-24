import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { parsePositiveId } from '../utils/parsePositiveId.js';
import { listSubjectsByClass } from '../services/subjects.service.js';

export const getSubjects = asyncHandler(async (req, res) => {
  const classId = parsePositiveId(req.query.classId, 'class ID');
  const subjects = await listSubjectsByClass(classId);

  res.status(200).json(ApiResponse.success(subjects, 'Subjects fetched successfully'));
});
