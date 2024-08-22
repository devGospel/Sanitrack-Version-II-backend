// import { Router } from "express"

// import document from "./document.controller"
// import validate from "../../middlewares/validate"
// import documentValidationSchema from "../../validator/document"
// import { GridFsStorage } from "multer-gridfs-storage"
// import { MONGODB_URI } from "../../constant/dburl"
// import crypto from "crypto"
// import path from "path"
// import multer from "multer"

// export default () =>{ 
//     const documentRouter = Router()
//     const storage  = new GridFsStorage({
//         url:MONGODB_URI,
//         file:(req,file)=>{
//         return new Promise((resolve, reject)=>{
//             crypto.randomBytes(16,(err,buf)=>{
//                 if(err){  
//                   return reject(err);
//                 }
//                 const filename = buf.toString('hex') + path.extname(file.originalname);
//                 // console.log("filename",filename)
//                 const fileInfo = {
//                     filename:filename,
//                     bucketName:'uploads', 
//                     metadata: req.body.locationId
//                 };
//                 resolve(fileInfo)
//             })
//         })
//       }
//   })
//     const upload = multer({ storage: storage , 
//       limits: {
//         fileSize: 5 * 1024 * 1024, // keep document size < 5 MB
//       },
//   });

//     documentRouter.post('/upload',  upload.single('pdf'), document.uploadDocument)
//     documentRouter.get('/get', document.getDocument)
//     documentRouter.put('/update', document.updateDocument)
//     documentRouter.delete('/delete', document.deleteDocument)

//     return documentRouter
// }