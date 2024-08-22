import {v2 as cloudinary} from 'cloudinary';
import env from 'dotenv'

env.config()
const cloudinaryConfig = {
    cloud_name: process.env.cloudinary_cloud,
    api_key: process.env.cloudinary_api__key,
    api_secret: process.env.cloudinary_api_secret,
    secure: true,
};

cloudinary.config(cloudinaryConfig)
export default cloudinary