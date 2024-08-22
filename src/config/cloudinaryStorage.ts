import {v2 as cloudinary} from 'cloudinary';
import { AuthenticatedRequest } from '../middlewares/security';
import { getLoggedInUserRoleName } from '../utils/getLoggedInUserRoleName';
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// Set up Cloudinary storage with Multer
export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: AuthenticatedRequest, file:Express.Multer.File) => {
        const timestamp = Date.now();
        const public_id = `${file.originalname}_${timestamp}`;
      return {
        folder: 'workOrders',
        public_id: public_id,
      };
    },
  });
