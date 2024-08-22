import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import customResponse from "../../helpers/response";

import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import CertificationModel from "../../models/certification";

const moduleName = '[certifications/controller]'
const Logger = createChildLogger(moduleName)

const addCertifications = catchAsync(async (req:AuthenticatedRequest, res:Response) => {
    const {name} = req.body
    const existingName = await CertificationModel.findOne({name: name})
    if(existingName){
        return customResponse.badRequestResponse('Name already exists', res)
    }
    const result = await CertificationModel.create({
        name: name
    })
    return customResponse.successResponse('certification created', result, res)
})

const getAllCertifications = catchAsync(async (req:AuthenticatedRequest, res:Response) => {
    // get all the ones where the level is 0 
    const result = await CertificationModel.find({level: 0})
    return customResponse.successResponse('All certificates', result, res)
})

const getSingleCertification = catchAsync(async (req:AuthenticatedRequest, res:Response) => {
    const {certificateId} = req.query
    if(!certificateId){ 
        return customResponse.notFoundResponse('Invalid Id', res)
    }
    const result = await CertificationModel.findById(certificateId)
    if(!result){ 
        return customResponse.notFoundResponse('There is no certification with the id',res)
    }
    return customResponse.successResponse('Single certificate detail', result, res)
})

const updateCertification = catchAsync(async (req:AuthenticatedRequest, res:Response) => {
    const {certificateId} = req.query
    const {name, level} = req.body

    if(!certificateId){ 
        return customResponse.badRequestResponse('Certificate Id is required', res)
    }
    let update: any = {};
    if (name) update.name = name;
    if (level) update.level = level;

    const updatedCertification = await CertificationModel.findByIdAndUpdate(
        certificateId,
        update,
        { new: true, runValidators: true }
    );

    if (!updatedCertification) {
    return customResponse.notFoundResponse('Certification not found', res);
    }

    return customResponse.successResponse('Certification updated successfully', updatedCertification, res);
})


export default{ 
    addCertifications, 
    getAllCertifications, 
    getSingleCertification, 
    updateCertification
}