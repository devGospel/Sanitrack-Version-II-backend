import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';





// Configure AWS SDK with your credentials
const s3Config = new S3Client({
  region: 'us-east-1',
  credentials:{
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!, 
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
}
});

// Configure multer to use AWS S3 as storage for Course Thumbnail
const uploadCourseThumbnail = multer({
  storage: multerS3({
    s3: s3Config,
    bucket: 'orionbucketlms',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read', 
    key: (req: Request, file: Express.Multer.File, cb: Function) => {
        const folder = 'thumbnails/course_thumbnails';
        const filename = Date.now().toString() + '-' + file.originalname;
        const key = folder + '/' + filename;
        cb(null, key); 
    }
  })
});


// Configure multer to use AWS S3 as storage for Course Thumbnail
const uploadLessonThumbnail = multer({
  storage: multerS3({
    s3: s3Config,
    bucket: 'orionbucketlms',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read', 
    key: (req: Request, file: Express.Multer.File, cb: Function) => {
        const folder = 'thumbnails/lesson_thumbnails/';
        const filename = Date.now().toString() + '-' + file.originalname;
        const key = folder + '/' + filename;
        cb(null, key); 
    }
  })
});


// Configure multer to use AWS S3 as storage for Course Thumbnail
const uploadLessonVideo = multer({
  storage: multerS3({
    s3: s3Config,
    bucket: 'orionbucketlms',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read', 
    key: (req: Request, file: Express.Multer.File, cb: Function) => {
        const folder = 'course-lesson/videos';
        const filename = Date.now().toString() + '-' + file.originalname;
        const key = folder + '/' + filename;
        cb(null, key); 
    }
  })
});


const uploadTrainingResource = multer({
  storage: multerS3({
      s3: s3Config,
      bucket: 'orionbucketlms',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: 'public-read',
      key: (req: Request, file: Express.Multer.File, cb: Function) => {
          const folder = 'training/resources';
          const filename = Date.now().toString() + '-' + file.originalname;
          const key = `${folder}/${filename}`;
          cb(null, key);
      }
  })
}).fields([
  { name: 'thumbnailUrl', maxCount: 1 },
  { name: 'resourceUrls', maxCount: 5 }
]); // Adjust the field names and limits as needed

export { 
  uploadCourseThumbnail,
  uploadLessonThumbnail,
  uploadLessonVideo,
  uploadTrainingResource,
  s3Config };