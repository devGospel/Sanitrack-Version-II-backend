import { AuthenticatedRequest } from '../../middlewares/security';
import customResponse from "../../helpers/response";
import { Request, Response } from 'express';
import { createChildLogger } from '../../utils/childLogger';
import TeamModel from '../../models/teams';
import mongoose from 'mongoose';
import UserRoles from '../../models/userRoles';
import { managerFacilityCheck } from '../../services/managerAsset';
import { getLoggedInUserRoleName } from '../../utils/getLoggedInUserRoleName';
import { Roles } from '../../constant/roles';

const moduleName = '[team/controller]'
const Logger = createChildLogger(moduleName)

const createTeam = async(req:AuthenticatedRequest, res:Response) => {
    try {
        const {teamName, members} = req.body
        const {facilityId} = req.query
        const normalizedTeamName = teamName.toLowerCase();
        const today = new Date()

        const roleName = getLoggedInUserRoleName(req);
        if (roleName === Roles.MANAGER && !facilityId) { 
            return customResponse.badRequestResponse('Facility Id is needed for this endpoint as a manager', res);
        }

        if (facilityId && !mongoose.Types.ObjectId.isValid(facilityId as string)) {
            return customResponse.badRequestResponse('Invalid facilityId.', res);
        }

        if (roleName === Roles.MANAGER) {
            const managerId = req.auth.userId
            const managerService = await managerFacilityCheck(managerId, facilityId as string);
            if (!managerService.found) {
                return customResponse.forbiddenResponse(managerService.message, res);
            }
        }

        // Validate userId and roleId of each member and check for duplicates
        const uniqueMembers = new Set();

        // Validate userId and roleId of each member
        for (const member of members) {
            if (!mongoose.Types.ObjectId.isValid(member.userId) || !mongoose.Types.ObjectId.isValid(member.roleId)) {
                return customResponse.badRequestResponse('Invalid userId or roleId in team members.', res);
            }

            // Check if the roleId belongs to the userId
            const userRole = await UserRoles.findOne({ user_id: member.userId, role_id: member.roleId });
            if (!userRole) {
                return customResponse.badRequestResponse(`Role ${member.roleId} does not belong to user ${member.userId}.`, res);
            }

            // Create a unique key for each userId-roleId pair
            const uniqueKey = `${member.userId}-${member.roleId}`;
            
            // Check for duplicates
            if (uniqueMembers.has(uniqueKey)) {
                return customResponse.badRequestResponse('Duplicate userId and roleId combination found in team members.', res);
            }
            uniqueMembers.add(uniqueKey);
        }

        // Check for existing team with the same name
        const existingTeamByName = await TeamModel.findOne({ teamName: normalizedTeamName });
        if (existingTeamByName) {
            return customResponse.badRequestResponse('A team with the same name already exists.', res);
        }

        // Check for existing team with the same members and roles
        const existingTeamByMembers = await TeamModel.findOne({
            members: {
                $all: members.map((member: { userId: any; roleId: any; }) => ({
                    $elemMatch: { userId: member.userId, roleId: member.roleId }
                }))
            }
        });

        if (existingTeamByMembers) {
            return customResponse.badRequestResponse('A team with the same members and roles already exists.', res);
        }

        // Create the new team
        const newTeam = new TeamModel({
            teamName: normalizedTeamName, 
            facilityId: facilityId,
            members: members, 
            dateCreated: today
        })
        const savedTeam = await newTeam.save()
        return customResponse.successResponse('Team created', newTeam, res)
    } catch (error:any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred while creating a new team', res, error)
    }
}

const getAll = async(req: AuthenticatedRequest, res: Response) => { 
    try {
        const { facilityId } = req.query;
        const managerId = req.auth.userId;
        let teams;

        const roleName = getLoggedInUserRoleName(req);
        if (roleName === Roles.MANAGER && !facilityId) { 
            return customResponse.badRequestResponse('Facility Id is needed for this endpoint as a manager', res);
        }
        
        if (facilityId && !mongoose.Types.ObjectId.isValid(facilityId as string)) {
            return customResponse.badRequestResponse('Invalid facilityId.', res);
        }

        if (facilityId) { 
            const managerService = await managerFacilityCheck(managerId, facilityId as string);
            if (managerService.found) { 
                teams = await TeamModel.find({ facilityId: facilityId });
            } else {
                return customResponse.forbiddenResponse('You do not have access to this facility.', res);
            }
        } else {
            teams = await TeamModel.find();
        }

        return customResponse.successResponse('Teams fetched', teams, res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse('An error occurred while getting all teams', res, error);
    }
}


const getById = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const teamId = req.query.teamId as unknown as string

        // Validate teamId
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return customResponse.badRequestResponse('Invalid teamId', res);
        }

         // Check if team exists
        const team = await TeamModel.findById(teamId).populate('members.userId members.roleId');
        if (!team) {
            return customResponse.badRequestResponse('Team not found', res);
        }
        return customResponse.successResponse('Team details fetched', team, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred while getting teams by Id', res, error)
    }
}

const addTeamMembers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const teamId = req.params.teamId as string;
        const { members } = req.body;

        // Check if team exists
        const team = await TeamModel.findById(teamId);

        if (!team) {
            return customResponse.badRequestResponse('Team not found', res);
        }

          // Check if the roleId belongs to the userId

        // Add new members to the team, ensuring no duplicates
        members.forEach((member:any) => {
            if (!team.members.some((m) => m.userId.toString() === member.userId.toString())) {
                team.members.push({ userId: member.userId as any, roleId:member.roleId});
            }
        });

        await team.save();

        return customResponse.successResponse('Team members added successfully', team, res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse('An error occurred while adding team members', res, error);
    }
};

const removeTeamMembers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const teamId = req.params.teamId as string;
        const { members } = req.body;

        // Check if team exists
        const team = await TeamModel.findById(teamId);

        if (!team) {
            return customResponse.badRequestResponse('Team not found', res);
        }

        // Filter out members to be removed
        team.members = team.members.filter((item) => !members.includes(item.userId.toString()));

        await team.save();

        return customResponse.successResponse('Team members removed successfully', team, res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse('An error occurred while removing team members', res, error);
    }
};

const deleteTeam = async(req:AuthenticatedRequest, res:Response) => { 
    try {
        const teamId = req.query.teamId as unknown as string
        // Validate teamId
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return customResponse.badRequestResponse('Invalid teamId', res);
        }

        // Check if team exists
        const team = await TeamModel.findById(teamId);
        if (!team) {
            return customResponse.badRequestResponse('Team not found', res);
        }
        
        await TeamModel.findByIdAndDelete(teamId)
        customResponse.successResponse('Team deleted', {}, res)
    } catch (error: any) {
        Logger.error(error)
        customResponse.serverErrorResponse('An error occurred while deleting a team', res, error)
    }
}
export default{ 
    addTeamMembers,
    removeTeamMembers,
    createTeam, 
    getAll,
    getById,
    deleteTeam
}