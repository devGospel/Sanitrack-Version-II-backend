import { Request, Response } from "express";
import Training  from "../../models/training";
import customResponse from "../../helpers/response";
import { AuthenticatedRequest } from "../../middlewares/security";
import User from "../../models/user";
import Team from "../../models/teams"
import Library from "../../models/library"
import path from 'path'
import { createChildLogger } from "../../utils/childLogger";
import TeamTrainingStatus from "../../models/trainingStatus"
import TrainingIndividual from "../../models/trainingIndividuals";
import mongoose from "mongoose";

const moduleName = '[training/controller]'
const Logger = createChildLogger(moduleName)
/**
 * Create a new course with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */

// Create Training controller
const createTraining = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Destructure required fields from request body
        const {
            name,
            trainerId,
            locationId,
            teamIds,
            traineeId,
            resourceId,
            date,
            time
        } = req.body;

        // Create new training instance
        const training = new Training({
            name: name,
            creator: req.auth.userId,
            trainers: trainerId, // Assuming userId is the trainer ID
            location: locationId,
            team: teamIds,
            trainee: traineeId,
            trainingResources: resourceId, // Store URLs of the uploaded files
            scheduledDate: date,
            scheduledTime: time
        });

        // Save training instance to the database
        const savedTraining = await training.save();

        // Create team training statuses and add individuals to TrainingIndividual
        const teamTrainingStatuses = await Promise.all(teamIds.map(async (teamId: mongoose.Types.ObjectId) => {
            const team = await Team.findById(teamId).populate('members');
            if (team) {
                const membersStatus = team.members.map((member: any) => ({
                    member: member._id,
                    status: 'pending', // Default status
                    remark: 'pending' // Default remark
                }));

                const teamTrainingStatus = new TeamTrainingStatus({
                    creator: req.auth.userId,
                    training: savedTraining._id,
                    team: teamId,
                    membersStatus: membersStatus,
                });

                // Save team training status
                await teamTrainingStatus.save();

                // Add each member to TrainingIndividual
                await Promise.all(team.members.map(async (member: any) => {
                    const trainingIndividual = new TrainingIndividual({
                        userId: member.userId,
                        status: 'pending', // Default status
                        remark: 'pending', // Default remark
                        trainingId: savedTraining._id,
                        isCertified: false // Default value
                    });
                    return trainingIndividual.save();
                }));
            }
            // Add each trainee to TrainingIndividual
            if (traineeId && traineeId.length > 0) {
                await Promise.all(traineeId.map(async (trainee: mongoose.Types.ObjectId) => {
                    const trainingIndividual = new TrainingIndividual({
                        userId: trainee,
                        status: 'pending', // Default status
                        remark: 'pending', // Default remark
                        trainingId: savedTraining._id,
                        isCertified: false // Default value
                    });
                    return trainingIndividual.save();
                }));
            }

            return null;
        }));

        // Return success response
        return customResponse.createResponse("Training created successfully", savedTraining, res);
    } catch (err: any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occurred while creating a training", res, err);
    }
};

// Read Training by ID
const getTrainingById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { trainingId } = req.params;

        // Find training by ID
        const training = await Training.findById(trainingId).populate('location team trainee');

        if (!training) {
            return customResponse.notFoundResponse("Training not found", res);
        }

        // Return success response
        return customResponse.successResponse("Training retrieved successfully", training, res);
    } catch (err:any) {
        // Log error
    Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occured, failed to retrieve training", res, err);
    }
};

// Update Training by ID
const updateTraining = async (req: any, res: Response) => {
    try {
        const { trainingId } = req.params;
        const updateFields = req.body;

        // Check if training resource is uploaded
        if (req.file) {
            // Get URL of the uploaded file (assuming you're using Amazon S3)
            const resourceUrl = req.file.location;
            // Add the new training resource URL to the update fields
            updateFields.trainingResources = [resourceUrl];
        }

        // Update training by ID
        const updatedTraining = await Training.findByIdAndUpdate(trainingId, updateFields, { new: true });

        if (!updatedTraining) {
            return customResponse.notFoundResponse("Training not found", res);
        }

        // Return success response
        return customResponse.successResponse("Training updated successfully", updatedTraining, res);
    } catch (err:any) {
        // Log error
    Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occured, failed to update training", res, err);
    }
};

// Delete Training by ID
const deleteTraining = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { trainingId } = req.params;

        // Find and delete training by ID
        const deletedTraining = await Training.findByIdAndDelete(trainingId);

        if (!deletedTraining) {
            return customResponse.notFoundResponse("Training not found", res);
        }

        // Return success response
        return customResponse.successResponse("Training deleted successfully", null, res);
    } catch (err:any) {
        // Log error
    Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occured, failed to delete training", res, err);
    }
};

const getAllTrainings = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Retrieve all trainings from the database
        const trainings = await Training.find().populate({
            path: 'team',
            populate: {
                path: 'members.userId',
                model: 'User',
                select: 'username' // Select only the username field from the User model
            }
        })

        // Return success response with the retrieved trainings
        return customResponse.successResponse("Trainings retrieved successfully", trainings, res);
    } catch (err: any) {
        // Log error
    Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occured, failed to retrieve trainings", res, err);
    }
};


const getTeamAndMembersStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { trainingId } = req.params;

        // Find all team training statuses for the specified training
        const teamTrainingStatuses = await TeamTrainingStatus.find({ training: trainingId })
        .populate({
            path: 'creator',
            select: 'username'
        })
        .populate({
            path: 'training',
            select: 'name'
        })
        .populate({
            path: 'membersStatus.member',
            select: 'username'
        })


        if (!teamTrainingStatuses || teamTrainingStatuses.length === 0) {
            return customResponse.notFoundResponse('No team training statuses found for the specified training', res);
        }

        // Return success response with the data
        return customResponse.successResponse('Team training statuses retrieved successfully', teamTrainingStatuses, res);
    } catch (error: any) {
        // Log error
        Logger.error('Error retrieving team training statuses:', error);
        // Return server error response
        return customResponse.serverErrorResponse('An error occurred while retrieving team training statuses', res, error);
    }
};



const getAllTeamsAndMembersStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const creatorId = req.auth.userId;

        // Find all team training statuses for the specified training
        const teamTrainingStatuses = await TeamTrainingStatus.find({creator: creatorId} )
            .populate({
                path: 'team',
                select: 'name',
            })
            .populate({
                path: 'membersStatus.member',
                select: 'username',
            });

        if (!teamTrainingStatuses || teamTrainingStatuses.length === 0) {
            return customResponse.notFoundResponse('No team training statuses found for the specified training creator', res);
        }

        // Return success response with the team training statuses
        return customResponse.successResponse('Team training statuses retrieved successfully', teamTrainingStatuses, res);
    } catch (error: any) {
        // Log error
        Logger.error('Error retrieving team training statuses:', error);
        // Return server error response
        return customResponse.serverErrorResponse('An error occurred while retrieving team training statuses', res, error);
    }
};

const trainingAdminDashboard = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth.userId; // Assuming authenticated user's ID is available in the request

        const statistics = await TeamTrainingStatus.aggregate([
            {
                $match: { creator: mongoose.Types.ObjectId.createFromHexString(userId) }
            },
            {
                $group: {
                    _id: null,
                    createdTrainingsCount: { $sum: 1 },
                    totalTeamsEnrolled: { $sum: 1 }, // Assuming each document represents a team enrolled
                    totalTraineesEnrolled: { $sum: { $size: "$membersStatus" } },
                    totalCompletedTrainings: {
                        $sum: {
                            $cond: { if: { $eq: [{ $last: "$membersStatus.status" }, "complete"] }, then: 1, else: 0 }
                        }
                    }
                }
            }
        ]);

        // Calculate average completion rate
        const averageCompletionRate = statistics.length > 0 ?
            (statistics[0].totalCompletedTrainings / statistics[0].createdTrainingsCount) * 100 :
            0;

        // Fetch all courses for the creator
        const courses = await Training.find({ creator: userId });

        // Prepare and return the response
        const response = {
            createdTrainingsCount: statistics.length > 0 ? statistics[0].createdTrainingsCount : 0,
            totalTeamsEnrolled: statistics.length > 0 ? statistics[0].totalTeamsEnrolled : 0,
            totalTraineesEnrolled: statistics.length > 0 ? statistics[0].totalTraineesEnrolled : 0,
            averageCompletionRate: averageCompletionRate,
            courses: courses
        };

        return customResponse.successResponse("User statistics retrieved successfully", response, res);
    } catch (err: any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("Oops! Failed to retrieve user statistics", res, err);
    }
};


const userDashboardStatistics = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth.userId; // Assuming authenticated user's ID is available in the request

        // Fetch all trainings where the user is a trainee or part of a team
        const trainings = await Training.find({
            $or: [
                { trainee: userId },
                { team: { $elemMatch: { members: userId } } }
            ]
        });

        const trainingIds = trainings.map(training => training._id);

        // Fetch training status for each training the user is enrolled in
        const trainingStatuses = await TeamTrainingStatus.find({ training: { $in: trainingIds }, 'membersStatus.member': userId })
            .populate('training')
            .populate({
                path: 'team',
                populate: { path: 'members' }
            });

        // Calculate statistics using map and reduce
        const { enrolledTrainingsCount, completedTrainingsCount, pendingTrainingsCount } = trainingStatuses.reduce((acc, status) => {
            const userStatus = status.membersStatus.find(memberStatus => String(memberStatus.member) === String(userId));
            if (userStatus) {
                if (userStatus.status === 'complete') {
                    acc.completedTrainingsCount++;
                } else if (userStatus.status === 'pending') {
                    acc.pendingTrainingsCount++;
                }
            }
            acc.enrolledTrainingsCount++;
            return acc;
        }, { enrolledTrainingsCount: 0, completedTrainingsCount: 0, pendingTrainingsCount: 0 });

        // Calculate average completion rate
        const totalTrainingsCount = completedTrainingsCount + pendingTrainingsCount;
        const averageCompletionRate = totalTrainingsCount > 0 ?
            (completedTrainingsCount / totalTrainingsCount) * 100 :
            0;

        // Prepare and return the response
        const response = {
            enrolledTrainingsCount,
            completedTrainingsCount,
            pendingTrainingsCount,
            averageCompletionRate,
            courses: trainingStatuses
        };

        return customResponse.successResponse("User statistics retrieved successfully", response, res);
    } catch (err: any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("Oops! Failed to retrieve user statistics", res, err);
    }
};


const getUserTeamTrainings = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth.userId; // Assuming authenticated user's ID is available in the request

        // Find all team training statuses for the specified user
        const teamTrainingStatuses = await TeamTrainingStatus.find({ 'membersStatus.member': userId })
            .populate('training', 'name') // Populate the training name
            .populate({
                path: 'team',
                populate: { path: 'members', select: 'username' } // Populate the team members' usernames
            });


        // Return success response with the user's team trainings
        return customResponse.successResponse('User team trainings retrieved successfully', teamTrainingStatuses, res);
    } catch (error: any) {
        // Log error
        Logger.error('Error retrieving user team trainings:', error);
        // Return server error response
        return customResponse.serverErrorResponse('An error occurred while retrieving user team trainings', res, error);
    }
};

const updateRemark = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { trainingId, memberId, remark } = req.body;
        const userId = req.auth.userId;

        // Check if the authenticated user is the creator of the training
        const isCreator = await Training.exists({ _id: trainingId, creator: userId });
        if (!isCreator) {
            return customResponse.notFoundResponse("No training found for this user", res);
        }

        // Find the training individual for the member
        const trainingIndividual = await TrainingIndividual.findOne({ trainingId: trainingId, userId: memberId });
        if (!trainingIndividual) {
            return customResponse.notFoundResponse('Member not found in training', res);
        }

        // Update the remark based on the new remark value
        const newRemark = remark.toLowerCase();
        if (newRemark === 'approved' || newRemark === 'rejected') {
            trainingIndividual.remark = newRemark;
            // Update isCertified based on the remark
            if (newRemark === 'approved') {
                trainingIndividual.isCertified = true;
                trainingIndividual.status = 'completed';
            } else if (newRemark === 'rejected') {
                trainingIndividual.status = 'pending';
            }
            await trainingIndividual.save();
            return customResponse.successResponse('Remark updated successfully', trainingIndividual, res);
        } else {
            return customResponse.badRequestResponse('Invalid remark value. Remark should be either "approved" or "rejected"', res);
        }
    } catch (error: any) {
        // Log error
        Logger.error('Error updating remark:', error);
        // Return server error response
        return customResponse.serverErrorResponse('An error occurred while updating remark', res, error);
    }
};

const updateStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { trainingId, status } = req.body;
        const userId = req.auth.userId;

        // Find the training individual for the specified training and user
        const trainingIndividual = await TrainingIndividual.findOne({ trainingId: trainingId, userId: userId });
        if (!trainingIndividual) {
            return customResponse.notFoundResponse('Training individual not found for the specified training and user', res);
        }

        // Update the status
        if (status === 'in progress' || status === 'complete') {
            trainingIndividual.status = status;
            await trainingIndividual.save();
            return customResponse.successResponse('Status updated successfully', trainingIndividual, res);
        } else {
            return customResponse.badRequestResponse('Invalid status value. Status should be either "in progress" or "complete"', res);
        }
    } catch (error: any) {
        // Log error
        Logger.error('Error updating status:', error);
        // Return server error response
        return customResponse.serverErrorResponse('An error occurred while updating status', res, error);
    }
};

// Controller to fetch all trainings and the status of all users in those trainings
const getAllTrainingsWithUserStatus = async (req: Request, res: Response) => {
    try {
        // Find all team training statuses
        const teamTrainingStatuses = await TeamTrainingStatus.find()
            .populate('training', 'name') // Populate the training name
            .populate({
                path: 'team',
                populate: { path: 'members', select: 'username' } // Populate the team members' usernames
            })
            .populate({
                path: 'membersStatus.member',
                select: 'username' // Populate the member's username
            });

        // Return success response with all trainings and user statuses
        return customResponse.successResponse('All trainings with user statuses retrieved successfully', teamTrainingStatuses, res);
    } catch (error: any) {
        // Log error
        Logger.error('Error retrieving all trainings with user statuses:', error);
        // Return server error response
        return customResponse.serverErrorResponse('An error occurred while retrieving all trainings with user statuses', res, error);
    }
};

const listUsersTrainingsInTable = async (req: Request, res: Response) => {
    try {
        // Fetch all training statuses
        const teamTrainingStatuses = await TeamTrainingStatus.find()
            .populate('training', 'name') // Populate the training name
            .populate({
                path: 'membersStatus.member',
                select: 'username' // Populate the member's username
            });

        // Extract unique trainings and users
        const trainingsMap: { [key: string]: any } = {};
        const usersMap: { [key: string]: any } = {};

        teamTrainingStatuses.forEach((teamTrainingStatus) => {
            const trainingId = teamTrainingStatus.training._id.toString();
            if (!trainingsMap[trainingId]) {
                trainingsMap[trainingId] = {
                    trainingId,
                    trainingName: teamTrainingStatus.training,
                };
            }
            teamTrainingStatus.membersStatus.forEach((memberStatus) => {
                const userId = memberStatus.member._id.toString();
                if (!usersMap[userId]) {
                    usersMap[userId] = {
                        userId,
                        username: memberStatus.member,
                        trainings: {},
                    };
                }
                usersMap[userId].trainings[trainingId] = {
                    status: memberStatus.status,
                    remark: memberStatus.remark,
                };
            });
        });

        // Create a list of trainings and users
        const trainingsList = Object.values(trainingsMap);
        const usersList = Object.values(usersMap).map((user: any) => {
            const userTrainings = trainingsList.map((training: any) => ({
                trainingId: training.trainingId,
                trainingName: training.trainingName,
                status: user.trainings[training.trainingId]?.status || 'N/A',
                remark: user.trainings[training.trainingId]?.remark || 'N/A',
            }));
            return {
                userId: user.userId,
                username: user.username,
                trainings: userTrainings,
            };
        });

        // Structure the data as a table
        const tableData = {
            trainings: trainingsList,
            users: usersList,
        };

        // Return success response with the table data
        return customResponse.successResponse('Users and their trainings retrieved successfully in table format', tableData, res);
    } catch (error: any) {
        // Log error
        Logger.error('Error retrieving users and their trainings in table format:', error);
        // Return server error response
        return customResponse.serverErrorResponse('An error occurred while retrieving users and their trainings in table format', res, error);
    }
};

const getAllTrainingIndividuals = async (req: Request, res: Response) => {
    try {
        // Fetch all training individuals from the database
        const trainingIndividuals = await TrainingIndividual.find().populate('userId').populate('trainingId');

        // Return success response
        return customResponse.createResponse("Training individuals fetched successfully", trainingIndividuals, res);
    } catch (err: any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("An error occurred while fetching training individuals", res, err);
    }
};

const getAllIndividualsForATraining = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { trainingId } = req.params;

        // Find all individuals for the specified training
        const individuals = await TrainingIndividual.find({trainingId}).populate('userId');

        if (!individuals || individuals.length === 0) {
            return customResponse.notFoundResponse('No individuals found for the specified training', res);
        }

        return customResponse.successResponse('Individuals retrieved successfully', individuals, res);
    } catch (error: any) {
        // Log error
        Logger.error('Error retrieving individuals for a training:', error);
        // Return server error response
        return customResponse.serverErrorResponse('An error occurred while retrieving individuals for a training', res, error);
    }
};


export default {
    createTraining,
    getTrainingById,
    updateTraining,
    deleteTraining,
    getAllTrainings,
    getTeamAndMembersStatus,
    getAllTeamsAndMembersStatus,
    trainingAdminDashboard,
    userDashboardStatistics,
    getUserTeamTrainings,
    updateRemark,
    updateStatus,
    getAllTrainingsWithUserStatus,
    listUsersTrainingsInTable,
    getAllTrainingIndividuals,
    getAllIndividualsForATraining
};
