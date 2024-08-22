import multer from "multer";
import { storage } from "./cloudinaryStorage";
import { AuthenticatedRequest } from "../middlewares/security";
import { NextFunction, Response } from "express";
import customResponse from "../helpers/response"

export const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 1 // Maximum number of files in a single request
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
          cb(null, true);
        } else {
          const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
            error.message = 'Invalid file type. Only PNG, JPEG, JPG files are allowed.';
            cb(error); // Reject the file with a specific MulterError
        }
    },
    
});

// Middleware for handling errors from Multer
export const handleMulterErrors = (err: any, req: AuthenticatedRequest, res:Response, next:NextFunction) => {
  if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      return customResponse.badRequestResponse(err.message, res )
  } else if (err) {
      // Handle other errors, such as file type validation errors
      return customResponse.badRequestResponse(err.message, res )
  } else {
      next();
  }
};