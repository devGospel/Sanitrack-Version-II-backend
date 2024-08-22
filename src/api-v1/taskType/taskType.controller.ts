import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from 'express';
import customResponse from "../../helpers/response";
import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import TaskTypeModel from "../../models/taskType";
import mongoose from "mongoose";

const moduleName = "[task type/controller]";
const Logger = createChildLogger(moduleName);

/**
 * Create a new task type
 * @param req - Authenticated request object
 * @param res - Response object
 */
const createTaskType = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, document } = req.body;

    let isDefault = true
    const count = await TaskTypeModel.countDocuments()
    if(count > 0){ 
        isDefault = false
    }
    // Create a new task type document
    const newTaskType = new TaskTypeModel({ name, description, document, isDefault });
    await newTaskType.save();

    //Logger.info(`Task type created: ${name}`);
    return customResponse.successResponse('Task type created successfully', newTaskType, res)
});

/**
 * Get all task types
 * @param req - Authenticated request object
 * @param res - Response object
 */
const getAll = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    // Retrieve all task types from the database
    const taskTypes = await TaskTypeModel.find();

    // Logger.info(`Retrieved all task types`);
    return customResponse.successResponse('Retrieved all task types', taskTypes, res);
});

/**
 * Get a single task type by ID
 * @param req - Authenticated request object
 * @param res - Response object
 */
const getSingle = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return customResponse.badRequestResponse('Invalid Id', res);
    }
    // Retrieve task type by ID
    const taskType = await TaskTypeModel.findById(id);

    if (!taskType) {
        //Logger.error(`Task type not found: ${id}`);
        return customResponse.forbiddenResponse('Task type not found', res);
    }

    Logger.info(`Retrieved task type: ${id}`);
    return customResponse.successResponse('Task type retrieved successfully', taskType, res);
});

/**
 * Update a task type by ID
 * @param req - Authenticated request object
 * @param res - Response object
 */
const update = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, document } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return customResponse.badRequestResponse('Invalid  Id', res);
    }
    // Update task type by ID
    const updatedTaskType = await TaskTypeModel.findByIdAndUpdate(id, { name, description, document }, { new: true });

    if (!updatedTaskType) {
        Logger.error(`Task type not found: ${id}`);
        return customResponse.forbiddenResponse('Task type not found', res);
    }

    Logger.info(`Task type updated: ${id}`);
    return customResponse.successResponse('Task type updated successfully', updatedTaskType, res);
});

/**
 * Delete a task type by ID
 * @param req - Authenticated request object
 * @param res - Response object
 */
const deleteSingle = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return customResponse.badRequestResponse('Invalid  Id', res);
    }
    // Delete task type by ID
    await TaskTypeModel.findByIdAndDelete(id);


    //Logger.info(`Task type deleted: ${id}`);
    return customResponse.successResponse('Task type deleted successfully', {}, res);
});
export default {
    createTaskType,
    getAll,
    getSingle,
    update,
    deleteSingle
}