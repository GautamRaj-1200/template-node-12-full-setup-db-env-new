# Middleware and utilities usage note

This note describes the helpers in `src/middleware` and `src/utils` and how they fit into the Express application.

## Import paths

The project uses ESM (`"type": "module"`), so TypeScript imports should use the `.js` extension even though the source files are `.ts`:

```ts
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
```

## `asyncHandler`

`asyncHandler` wraps an async Express route/controller and forwards rejected promises to Express's error pipeline. This avoids repeating `try/catch` in every async handler.

```ts
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await userService.list();
    return res.status(200).json(ApiResponse.success(users, 'Users fetched'));
  }),
);
```

If `userService.list()` rejects, `asyncHandler` calls `next(error)`, which eventually reaches `errorHandler`.

## `ApiError`

`ApiError` is the application error type for expected HTTP failures.

```ts
throw new ApiError(404, 'User not found');
throw new ApiError(400, 'Validation failed', ['Email is required', 'Password is too short']);
```

Constructor:

```ts
new ApiError(statusCode, message, errors?);
```

When handled by `errorHandler`, it returns:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Email is required", "Password is too short"]
}
```

The `errors` property is omitted when the array is empty. Use `ApiError` for errors that should be exposed to the client; avoid placing secrets or internal implementation details in its message or error list.

## `ApiResponse`

`ApiResponse<T>` standardizes successful responses with `success`, `message`, and optional `data` fields.

```ts
const response = ApiResponse.success(user, 'User fetched');
return res.status(200).json(response);
```

The default message is `Success`:

```ts
return res.status(201).json(ApiResponse.success(createdUser));
```

There is currently no failure factory. Use `ApiError` and the error middleware for failures rather than constructing a failure `ApiResponse` manually.

## `errorHandler`

`errorHandler` is registered in `src/app.ts` as the final middleware:

```ts
app.use(errorHandler);
```

It must remain after routes and the 404 handler. Express identifies it as an error middleware because it has four parameters: `(err, req, res, next)`.

Behavior:

- `ApiError`: responds with its status code and `{ success: false, message, errors? }`.
- Any other error: logs the error server-side and responds with HTTP `500` and `{ success: false, message: 'Internal Server Error' }`.

The application also has a 404 middleware before `errorHandler`:

```ts
app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found'));
});
```

Add new routes before this 404 block. A typical route flow is:

```ts
app.use('/api/v1/users', userRoutes);
app.use((req, _res, next) => next(new ApiError(404, 'Route not found')));
app.use(errorHandler);
```

## Recommended controller pattern

```ts
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(ApiResponse.success(user, 'User fetched'));
});
```

In short: wrap async handlers with `asyncHandler`, throw `ApiError` for expected failures, return `ApiResponse.success(...)` for successful payloads, and keep `errorHandler` last in the Express middleware chain.
