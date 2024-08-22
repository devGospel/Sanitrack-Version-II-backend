import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/security";
import customResponse from "../../../helpers/response";

import { createChildLogger } from "../../../utils/childLogger";
import catchAsync from "../../../utils/catchAsync";
import AssetTaskType, { RoomDetailCleaningType } from "../../../models/roomDetailCleaning";
import mongoose from "mongoose";
import CertificationModel, { ICertification } from "../../../models/certification";

const moduleName = '[Asset task certification/controller]'
const Logger = createChildLogger(moduleName)

const addCertificate = catchAsync(async (req: AuthenticatedRequest, res:Response) => { 
    const {selectedCertificates} = req.body
    const {assetTaskId} = req.query
    
    let existingCertificate:string[] = []

    if(!assetTaskId){ 
        return customResponse.badRequestResponse('The assetTaskId is required', res)
    }
    if (!selectedCertificates || selectedCertificates.length === 0) { 
        return customResponse.createResponse('No certifications provided', {}, res);
    }

    const assetTaskDetails = await AssetTaskType.findById(assetTaskId) as Partial<RoomDetailCleaningType>
    if(!assetTaskDetails){ 
        return customResponse.notFoundResponse('There is no asset task with such id', res)
    }

    await Promise.all(selectedCertificates.map(async (certificateId: mongoose.Types.ObjectId) => { 
        if (assetTaskDetails.certification?.includes(certificateId)) { 
            const certificateDetails = await CertificationModel.findById(certificateId) as Partial<ICertification>;
            if(!certificateDetails){ 
                return customResponse.notFoundResponse('There is no such certificate with the id',res)
            }
            if (certificateDetails?.name) {
                existingCertificate.push(certificateDetails.name as unknown as string);
            }
        } else { 
            assetTaskDetails.certification = assetTaskDetails.certification || [];
            assetTaskDetails.certification.push(certificateId);
        }
    }));

    // Save the updated asset task details
    await AssetTaskType.findByIdAndUpdate(assetTaskId, { certification: assetTaskDetails.certification });


    if(existingCertificate.length > 0){
        return customResponse.successResponse(`${existingCertificate.join(' ')} is already assigned to the asset task`, {}, res)
    }else{ 
        return customResponse.successResponse('Certificates assigned', {}, res)
    }
})

const removeCertificate = catchAsync(async (req: AuthenticatedRequest, res:Response) => { 
    const { certificateIds } = req.body;
    const { assetTaskId } = req.query;

    if (!assetTaskId) {
        return customResponse.badRequestResponse('The assetTaskId is required', res);
    }
    if (!certificateIds || certificateIds.length === 0) {
        return customResponse.createResponse('No certifications provided for removal', {}, res);
    }

    const assetTaskDetails = await AssetTaskType.findByIdAndUpdate(
        assetTaskId,
        { $pull: { certification: { $in: certificateIds } } },
        { new: true }
      );
  
    if (!assetTaskDetails) {
    return customResponse.notFoundResponse('No asset task found with the provided ID', res);
    }

    return customResponse.successResponse('Certificates removed successfully', {}, res);
})

// get the asset task certificate 
const getAssetTaskCertificate = catchAsync(async (req:AuthenticatedRequest, res: Response) => { 
    const {assetTaskId} = req.query
    if (!assetTaskId) {
        return customResponse.badRequestResponse('The assetTaskId is required', res);
    }

    const result = await AssetTaskType.findById(assetTaskId) .select('-roomId -assetId -cleaningType -cleaningTypeFrequency -isDefault -mssActive').populate('certification')
    return customResponse.successResponse('Asset Certification', result, res)
})
export default{ 
    addCertificate, 
    removeCertificate,
    getAssetTaskCertificate
}