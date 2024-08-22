import multer from 'multer';
import path from 'path';

export const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedExcelTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowedExcelTypes.includes(file.mimetype)) {
            cb(null, true);
        }else {
            const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
              error.message = 'Invalid file type. Only XLSX and XLS are allowed.';
              cb(error); // Reject the file with a specific MulterError
          }
    }
});


