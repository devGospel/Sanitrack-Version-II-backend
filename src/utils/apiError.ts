interface ApiError extends Error {
    statusCode: number;
    isOperational?: boolean;
  }
  
  class ApiError extends Error {
    constructor(statusCode: number, message: string, isOperational?: boolean | null, stack?: string | null) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational || true;
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  export default ApiError;
  