import customResponse from "../../helpers/response"
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";

import { createChildLogger } from "../../utils/childLogger";
import ChemicalGroupModel from "../../models/chemicalGroup";

const moduleName = '[chemicalGroup/controller]'
const Logger = createChildLogger(moduleName)

const addChemicalGroup = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const {name} = req.body
        const chemicalGroups = name.split(',').map((tag: string) => tag.trim());
        for(const cG of chemicalGroups){ 
            const existingChemicalGroup = await ChemicalGroupModel.findOne({ name: cG });
        
            // If tag does not exist, create it
            if (!existingChemicalGroup) {
                await ChemicalGroupModel.create({ name: cG });
            } 
        }
        return customResponse.successResponse('Chemical Group Added', {}, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the add chemcial group endpoint', res, error)
    }
}

const getChemicalGroup = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const cGQuery = ChemicalGroupModel.find().sort({ _id: -1 });

        const [totalChemicalGroups, allChemicalGroup] = await Promise.all([
            ChemicalGroupModel.countDocuments(),
            cGQuery.exec(),
        ]);

        // Prepare data to send in the response
        const data = {
            totalChemicalGroups,
            allChemicalGroup: allChemicalGroup,
        };
        // Return success response with paginated task information
        return customResponse.successResponse('Get all chemical group successful', data, res);
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the get chemcial group endpoint', res, error)
    }
}

const getSingleChemicalGroup = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const {chemicalGroupId} = req.query
        const tag = await ChemicalGroupModel.findById(chemicalGroupId)
        if(!tag) return customResponse.badRequestResponse('There is no chemical group with that id', res)

        return customResponse.successResponse('fetched', tag,res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the get single chemcial group endpoint', res, error)
    }
}

const updateChemicalGroup = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const {chemcialGroupId} = req.query
        const {name} = req.body
        const exists = await ChemicalGroupModel.findById(chemcialGroupId)
        if(!exists) return customResponse.badRequestResponse('There is no chemical group with such id', res)

        exists.name = name 
        await exists.save()
        return customResponse.successResponse('Chemical group name updated', {}, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the add chemcial group endpoint', res, error)
    }
}

const deleteChemicalGroup = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the add chemcial group endpoint', res, error)
    }
}

export default { 
    addChemicalGroup, 
    getChemicalGroup, 
    getSingleChemicalGroup, 
    updateChemicalGroup, 
    deleteChemicalGroup
}