import customResponse from "../../helpers/response"
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";

import { createChildLogger } from "../../utils/childLogger";
import TagModel from "../../models/tags";

const moduleName = '[tag/controller]'
const Logger = createChildLogger(moduleName)

const addTag = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {name} = req.body
        const tags = name.split(',').map((tag: string) => tag.trim());
        for(const tag of tags){ 
            const existingTag = await TagModel.findOne({ name: tag });
        
            // If tag does not exist, create it
            if (!existingTag) {
                await TagModel.create({ name: tag });
            } 
        }
        return customResponse.successResponse('Tag created', {}, res)
    } catch (error: any) {
        Logger.error(error)
        if (error.code && error.code === 11000) {
            return customResponse.badRequestResponse('This tag already exists', res);
        } else {
            return customResponse.serverErrorResponse('An error occurred in the add tag endpoint', res, error);
        }
       
    }
 }

const getTag = async(req: AuthenticatedRequest, res: Response) => { 
    try {
        const tagQuery = TagModel.find().sort({ _id: -1 });

        const [totalTags, allTags] = await Promise.all([
            TagModel.countDocuments(),
            tagQuery.exec(),
        ]);

        // Prepare data to send in the response
        const data = {
            totalTags,
            allTags: allTags,
        };
        // Return success response with paginated task information
        return customResponse.successResponse('Get all tags successful', data, res);
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occured when getting all tags', res, error)
    }
}

const getSingleTag = async(req: AuthenticatedRequest, res: Response) => {
    try {
        const {tagId} = req.query
        const tag = await TagModel.findById(tagId)
        if(!tag) return customResponse.badRequestResponse('There is no tag with that id', res)

        return customResponse.successResponse('fetched', tag,res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred when get this tag details', res, error)
    }
}

const updateTag = async(req: AuthenticatedRequest, res: Response) => { 
    try {
        
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the update tag endpoint', res, error)
    }
}

const deleteTag = async(req: AuthenticatedRequest, res: Response) => { 
    try {
        
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the delete tag endpoint', res, error)
    }
}
export default{ 
    addTag, 
    getTag, 
    getSingleTag, 
    updateTag, 
    deleteTag
}