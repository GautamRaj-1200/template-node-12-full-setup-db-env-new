export class ApiResponse<T> {
  constructor(
    public success: boolean,
    public message: string,
    public data?: T,
  ) {}

  static success<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }
}
