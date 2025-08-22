import mongoose from "mongoose";

import logger from "../logger/winston.logger.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeUnusedMulterImageFilesOnError } from "../utils/helper.js";
import { NextFunction, Request, Response } from "express";

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else {
    const isMongooseError = err instanceof mongoose.Error;
    const statusCode = isMongooseError ? 400 : 500;

    const message = err instanceof Error && err.message ? err.message : "Something went wrong";

    // Try to extract nested errors if present (e.g., mongoose validation errors or custom shapes)
    let nestedErrors: Error[] = [];
    if (isMongooseError && err && typeof err === "object" && "errors" in (err as any)) {
      const validationErrors = (err as any).errors;
      if (validationErrors && typeof validationErrors === "object") {
        const values = Object.values(validationErrors);
        nestedErrors = Array.isArray(values) ? (values as Error[]) : [];
      }
    } else if (err && typeof err === "object" && "errors" in (err as any) && Array.isArray((err as any).errors)) {
      nestedErrors = (err as any).errors as Error[];
    }

    const stack = err instanceof Error ? err.stack : undefined;
    apiError = new ApiError(statusCode, message, nestedErrors, stack);
  }

  // Now we are sure that the `apiError` variable will be an instance of ApiError class
  const response = {
    ...apiError,
    message: apiError.message,
    ...(process.env.NODE_ENV === "development" ? { stack: apiError.stack } : {}), // Error stack traces should be visible in development for debugging
  };

  logger.error(`${apiError.message}`);

  removeUnusedMulterImageFilesOnError(req);
  // Send error response
  return res.status(apiError.statusCode).json(response);
};

export { errorHandler };

