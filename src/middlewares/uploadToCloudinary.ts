/*import multer from 'multer';
import { Request, Response } from 'express';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'your_cloud_name',
    api_key: 'your_api_key',
    api_secret: 'your_api_secret'
});

// Create Cloudinary storage engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploadsLMS/',
        allowed_formats: ['png', 'jpg', 'jpeg', 'mp4', 'pdf'],
        // Add any additional options as needed
    }
});

// Create multer instance with Cloudinary storage engine
const upload = multer({ storage: storage });
*/
