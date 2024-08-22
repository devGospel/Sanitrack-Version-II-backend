import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from 'express';
import customResponse from "../../helpers/response";
import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import protectiveElementModel from "../../models/protectiveElement";
import mongoose from "mongoose";

const moduleName = "[protective equipment/controller]";
const Logger = createChildLogger(moduleName);

/**
 * Create a new protective equipment (PPE)
 * @param req - Authenticated request object
 * @param res - Response object
 */
const createPPE = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, quantity, pairs } = req.body;

    // Create a new PPE document
    const newPPE = new protectiveElementModel({ name, description, quantity, pairs });
    await newPPE.save();

    //Logger.info(`PPE created: ${name}`);
    return customResponse.successResponse('PPE created successfully', newPPE, res);
});

/**
 * Get all protective equipment (PPE)
 * @param req - Authenticated request object
 * @param res - Response object
 */
const getAll = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    // Retrieve all PPE from the database
    const ppeList = await protectiveElementModel.find();

    //Logger.info(`Retrieved all PPE`);
    return customResponse.successResponse('Retrieved all PPE', ppeList, res);
});

/**
 * Get a single protective equipment (PPE) by ID
 * @param req - Authenticated request object
 * @param res - Response object
 */
const getSingle = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Validate the ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return customResponse.badRequestResponse('Invalid PPE Id', res);
    }

    // Retrieve PPE by ID
    const ppe = await protectiveElementModel.findById(id);

    if (!ppe) {
        Logger.error(`PPE not found: ${id}`);
        return customResponse.notFoundResponse('PPE not found', res);
    }

    //Logger.info(`Retrieved PPE: ${id}`);
    return customResponse.successResponse('PPE retrieved successfully', ppe, res);
});


/**
 * Update a protective equipment (PPE) by ID
 * @param req - Authenticated request object
 * @param res - Response object
 */
const update = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, quantity, pairs } = req.body;

    // Validate the ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return customResponse.badRequestResponse('Invalid PPE Id', res);
    }

    // Update PPE by ID
    const updatedPPE = await protectiveElementModel.findByIdAndUpdate(id, { name, description, quantity, pairs }, { new: true });

    if (!updatedPPE) {
        Logger.error(`PPE not found: ${id}`);
        return customResponse.notFoundResponse('PPE not found', res);
    }

    //Logger.info(`PPE updated: ${id}`);
    return customResponse.successResponse('PPE updated successfully', updatedPPE, res);
});


/**
 * Delete a protective equipment (PPE) by ID
 * @param req - Authenticated request object
 * @param res - Response object
 */
const deleteSingle = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Validate the ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return customResponse.badRequestResponse('Invalid PPE Id', res);
    }

    // Delete PPE by ID
    const deletedPPE = await protectiveElementModel.findByIdAndDelete(id);

    if (!deletedPPE) {
        Logger.error(`PPE not found: ${id}`);
        return customResponse.notFoundResponse('PPE not found', res);
    }

    //Logger.info(`PPE deleted: ${id}`);
    return customResponse.successResponse('PPE deleted successfully', deletedPPE, res);
});

export default {
    createPPE,
    getAll,
    getSingle,
    update,
    deleteSingle
}