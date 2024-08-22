import { Request, Response } from "express";
import Library from "../../models/library";
import Training from "../../models/training";
import customResponse from "../../helpers/response";
import { AuthenticatedRequest } from "../../middlewares/security";
import { Logger } from "../../utils/logger";


const createLibraryResource = async (req: any, res: Response) => {
    try {
        // Check if files are uploaded
        if (!req.files || req.files.length === 0) {
            return customResponse.badRequestResponse('You must upload at least one file for the library resource', res);
        }
        // Extract the first file as thumbnail and the rest as resources
        const thumbnailFile = req.files['thumbnailUrl'] ;
        const resourceFiles = req.files['resourceUrls'];

        const thumbnailUrl = thumbnailFile[0].location;
        const resourceUrls =  resourceFiles[0].location//resourceFiles.map((file: any) => file.location);

        // Destructure required fields from request body
        const {
            resourceType,
            resourceTitle,
            article
        } = req.body;

        // Create a new library resource instance
        const libraryResource = new Library({
            resourceType,
            thumbnailUrl: thumbnailUrl,
            resourceTitle,
            resourceUrl: resourceUrls,
            article
        });

        // Save the library resource instance to the database
        const savedLibraryResource = await libraryResource.save();

        // Return success response
        return customResponse.createResponse("Library resource created successfully", savedLibraryResource, res);

    } catch (err: any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occurred while creating Library", res, err);
    }
};


const updateLibraryResourceById = async (req: any, res: Response) => {
    try {
        // Get the ID of the library resource to update
        const { resourceId } = req.params;

        // Find the existing library resource by ID
        let existingResource = await Library.findById(resourceId);

        // Check if the resource exists
        if (!existingResource) {
            return customResponse.notFoundResponse('Library resource not found', res);
        }

        // Extract the first file as thumbnail and the rest as resources
        const thumbnailFiles = req.files['thumbnailUrl'];
        const resourceFiles = req.files['resourceUrls'];

        // Initialize variables to store updated fields
        let updatedFields: any = {};

        // Update resourceType if provided in request
        if (req.body.resourceType) {
            updatedFields['resourceType'] = req.body.resourceType;
        }

        // Update resourceTitle if provided in request
        if (req.body.resourceTitle) {
            updatedFields['resourceTitle'] = req.body.resourceTitle;
        }

        // Update article if provided in request
        if (req.body.article) {
            updatedFields['article'] = req.body.article;
        }

        // Update thumbnailUrl if new thumbnail file is uploaded
        if (thumbnailFiles && thumbnailFiles.length > 0 && thumbnailFiles[0].location) {
            updatedFields['thumbnailUrl'] = thumbnailFiles[0].location;
        }

        // Update resourceUrl if new resource files are uploaded
        if (resourceFiles && resourceFiles.length > 0) {
            //const resourceUrls = resourceFiles.map((file: any) => file.location);
            updatedFields['resourceUrl'] = resourceFiles[0].location;
        }

        // Update the existing resource with the updated fields
        existingResource.set(updatedFields);

        // Save the updated resource
        const updatedResource = await existingResource.save();

        // Return success response
        return customResponse.createResponse("Library resource updated successfully", updatedResource, res);

    } catch (err: any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occurred while updating Library resource", res, err);
    }
};

const getAllLibraryResources = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Query database to retrieve all library resources
        const libraryResources = await Library.find();

        // Return success response with retrieved resources
        return customResponse.successResponse("Library resources retrieved successfully", libraryResources, res);
    } catch (err: any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occured while retrieving library resources", res, err);
    }
};

const getLibraryResourceById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { resourceId } = req.params;

        // Find the library resource by its ID
        const libraryResource = await Library.findById(resourceId);

        if (!libraryResource) {
            return customResponse.notFoundResponse('Library resource not found', res);
        }

        // Return success response with the library resource data
        return customResponse.successResponse('Library resource retrieved successfully', libraryResource, res);
    } catch (error: any) {
        // Log errors
        Logger.error('Error retrieving library resource:', error);
        return customResponse.serverErrorResponse('An error occurred while retrieving library resource', res, error);
    }
};


const deleteLibraryResource = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { resourceId } = req.params;

        // Find the library resource by its ID and delete it
        const deletedLibraryResource = await Library.findByIdAndDelete(resourceId);

        if (!deletedLibraryResource) {
            return customResponse.notFoundResponse('Library resource not found', res);
        }

        // Return success response
        return customResponse.successResponse('Library resource deleted successfully', null, res);
    } catch (error: any) {
        // Handle errors
        Logger.error('Error deleting library resource:', error);
        return customResponse.serverErrorResponse('Failed to delete library resource', res, error);
    }
};

const getUserLibraryResources = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.auth;

        // Find trainings where the user is either a trainee or a member of a team
        const trainings = await Training.find({
            $or: [
                { trainee: userId },
                { 'team.members': userId }
            ]
        }).populate('trainingResources');

        if (!trainings || trainings.length === 0) {
            return customResponse.notFoundResponse('No trainings found for the specified user', res);
        }

        // Extract library resources
        const libraryResources = trainings.reduce((resources: any[], training: any) => {
            return resources.concat(training.trainingResources);
        }, []);

        // Return success response with the library resources
        return customResponse.successResponse('Library resources retrieved successfully', libraryResources, res);
    } catch (err: any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse('An error occured while retrieving library resources', res, err);
    }
};

export default {
    createLibraryResource,
    getAllLibraryResources,
    getLibraryResourceById,
    getUserLibraryResources,
    updateLibraryResourceById,
    deleteLibraryResource
};
