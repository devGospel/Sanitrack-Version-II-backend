import multer from "multer";
import path from "path";
import { Request } from "express";

// Define allowed file types
const allowedFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'video/mp4', 'application/pdf'];

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: Function) => {
        cb(null, 'uploadsLMS/');
    },
    filename: (req: Request, file: Express.Multer.File, cb: Function) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
        cb(new Error('Only images (png, jpg, jpeg), videos (mp4), and PDFs are allowed!'));
    }
};

const limits = {
    fileSize: 1024 * 1024 * 100 // 100MB max file size
};

const upload = multer({ storage, fileFilter, limits });

export default upload;