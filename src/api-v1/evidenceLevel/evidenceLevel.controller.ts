import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from 'express';
import customResponse from "../../helpers/response";
import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import EvidenceLevelModel, { EvidenceLevel } from "../../models/evidenceLevel";

const moduleName = "[evidence level /controller]";
const Logger = createChildLogger(moduleName);

const addEvidenceLevel = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    const {name, minValue, maxValue} = req.body

    const existingName = await EvidenceLevelModel.findOne({name: name})
    if(existingName){ 
        return customResponse.badRequestResponse('Evidence level with the name exist', res)
    }
    // create the evidence 
    const evidence = await EvidenceLevelModel.create({ 
        name: name, 
        minValue: minValue, 
        maxValue: maxValue, 
        level: 0
    })
    return customResponse.successResponse('Evidence level added', evidence, res)
})
const viewEvidence = catchAsync(async (req: AuthenticatedRequest, res: Response) => { 
    const result = await EvidenceLevelModel.find({level:0})
    return customResponse.successResponse('All evidence', result, res)
})
const archiveEvidence = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const {evidenceId} = req.query
    const existingEvidence = await EvidenceLevelModel.findById(evidenceId)
    if(!existingEvidence){ 
        return customResponse.notFoundResponse('There is no evidence with such id',res)
    }
    // update the level of the evidence to 
    await EvidenceLevelModel.findByIdAndUpdate(evidenceId, {level: 1}, {new: true})

    return customResponse.successResponse('Evidence updated', {}, res)
})

const updateEvidence = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    const {name, minValue, maxValue} = req.body
    const {evidenceId} = req.query

    const existingEvidence = await EvidenceLevelModel.findById(evidenceId)
    if(!existingEvidence){ 
        return customResponse.notFoundResponse('There is no evidence with such Id', res)
    }
    const updateData: Partial<EvidenceLevel> = {};
    if (name !== undefined) updateData.name = name;
    if (minValue !== undefined) updateData.minValue = minValue;
    if (maxValue !== undefined) updateData.maxValue = maxValue;

    // Update the evidence level document
    const updated = await EvidenceLevelModel.findByIdAndUpdate(evidenceId, updateData, { new: true });
    return customResponse.successResponse('Evidence updated', updated, res)

})
export default{ 
    addEvidenceLevel, 
    viewEvidence, 
    archiveEvidence, 
    updateEvidence
}