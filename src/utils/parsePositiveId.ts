import { ApiError } from './ApiError.js';

export function parsePositiveId(value: unknown, name: string): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new ApiError(400, `A valid ${name} is required`);
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id) || id > 2_147_483_647) {
    throw new ApiError(400, `A valid ${name} is required`);
  }

  return id;
}
