// import { AuthenticatedRequest } from "../../middlewares/security";
// import { Response } from "express";
// import Logger from "../../utils/logger";
// import customResponse from "../../helpers/response"
// import DocumentModel from "../../models/files";
// import {Readable} from "stream"
// import gfs from "../../server";
// import gfsPromise from "../../server";

// const uploadDocument =async (req:AuthenticatedRequest, res:Response) => {
//   try{
//     return customResponse.successResponse('Upload sucessful', req.file , res)
//   }catch(error: any){ 
//     Logger.error('An error occured in the upload document endpoint')
//     return customResponse.serverErrorResponse('An error occured in the upload document endpoint', res, error)
//   }
   
// }

// const updateDocument = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//       const role = req.auth.role_id.role_name;
//       if(role !== 'Admin') {
//           return customResponse.badRequestResponse('You do not have permission to update the document for this location', res);
//       }
//       const { locationId } = req.query; // Assuming locationId is a parameter in the URL
//       const { title } = req.body;
  
//       // Check if the document for the specified location exists
//       const existingDocument = await DocumentModel.findOne({ location_id: locationId });
  
//       if (!existingDocument) {
//         return customResponse.notFoundResponse('Document not found for the specified location', res);
//       }
  
//       // Handle file update (if a new file is attached in the request)
//       if (req.file) {
//         const newFile = req.file as Express.Multer.File;
//         existingDocument.pdf = newFile.filename;
//       }
  
//       // Update other fields as needed
//       existingDocument.title = title;
      
//       // Save the updated document
//       await existingDocument.save();
  
//       return customResponse.successResponse('Document successfully updated', existingDocument, res);
//     } catch (err: any) {
//       Logger.error(err);
//       return customResponse.serverErrorResponse(
//         'Oops... Something occurred in the update document endpoint',
//         res,
//         err
//       );
//     }
//   };
  

  
//   const getDocument = async (req: AuthenticatedRequest, res: Response) => {
//     const locationId = req.query.locationId;
//     const gfs = await gfsPromise;
//     Logger.info("ddd")
//     gfs.findOne({ filename: "86341f0907c36cd74f6e853f08295384.pdf" }, (err, file) => {
//         if (err) {
//           Logger.error('err')
//             return res.status(500).json({
//                 err: 'Internal server error'
//             });
//         }

//         // Check if file exists
//         if (!file) {
//           Logger.error('no file')
//             return res.status(404).json({
//                 err: 'No file exists'
//             });
//         }

//         // File exists
//         return res.json(file);
//     });
// };


// const deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//       const { locationId } = req.params; // Assuming locationId is a parameter in the URL
  
//       // Check if the document for the specified location exists
//       const existingDocument = await DocumentModel.findOne({ location_id: locationId });
  
//       if (!existingDocument) {
//         return customResponse.notFoundResponse('Document not found for the specified location', res);
//       }
  
//       // Delete the document
//       await DocumentModel.deleteOne({ location_id: locationId });
  
//       return customResponse.successResponse('Document successfully deleted', {}, res);
//     } catch (err: any) {
//       Logger.error(err);
//       return customResponse.serverErrorResponse(
//         'Oops... Something occurred in the delete document endpoint',
//         res,
//         err
//       );
//     }
//   };
  
// export default{ 
//     uploadDocument, 
//     getDocument, 
//     updateDocument,
//     deleteDocument
// }