import { AuthenticatedRequest } from '../../middlewares/security';
import customResponse from "../../helpers/response";
import { Request, Response } from 'express';
import { createChildLogger } from '../../utils/childLogger';
import RoomModel from '../../models/room';
import AssetGroupModel from '../../models/assetsGroup';
import { nodeModuleNameResolver } from 'typescript';
import mongoose from 'mongoose';
import RoomDetailModel from '../../models/roomDetail';
import { GroupDetailWithInfo } from '../../types/interface';
import catchAsync from '../../utils/catchAsync';

const moduleName = '[roomAsset/controller]'
const Logger = createChildLogger(moduleName)

const initialize = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    // in here, I want to display all assets and their rooms 
    const allRooms = await RoomDetailModel.find().populate('roomId')
    return customResponse.successResponse('all rooms', allRooms, res)
}) 

const createAssetGroup = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    // get the roomId as well as the detail id for the room passed and then save the group name for the assets too 
    const {groupName, groupDetail} = req.body
    const normalizedGroupName = groupName.toLowerCase();
    const today = new Date()

    // Validate userId and roleId of each member
    for (const details of groupDetail) {
        const { roomId, detailId } = details;
        if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(detailId)) {
            return customResponse.badRequestResponse('Invalid roomId or detailId in group details.', res);
        }

        const room = await RoomModel.findById(roomId);
        if (!room) {
            return customResponse.badRequestResponse(`Room with ID ${roomId} does not exist.`, res);
        }

        // const roomDetail = await RoomDetailModel.findById(detailId);
        // if (!roomDetail) {
        //     return customResponse.badRequestResponse(`RoomDetail with ID ${room.detail} does not exist.`, res);
        // }

    }
    // Check for existing group with the same name
    const existingGroupByName = await AssetGroupModel.findOne({ groupName: normalizedGroupName });
    if (existingGroupByName) {
        return customResponse.badRequestResponse('A group with the same name already exists.', res);
    }

    // Check for existing group with the same roomId and detailId
    const existingGroupByDetail =  await AssetGroupModel.findOne({
        groupDetail: {
            $all: groupDetail.map((details: { roomId: any; detailId: any; }) => ({
                $elemMatch: { roomId: details.roomId, detailId: details.detailId }
            }))
        }
    });

    if (existingGroupByDetail) {
        return customResponse.badRequestResponse('A group with the same roomId and detailId already exists.', res);
    }

    // Create the new asset group
    const newGroup = AssetGroupModel.create({
        groupName: normalizedGroupName, 
        groupDetail: groupDetail, 
        dateCreated: today
    })
    return customResponse.successResponse('Asset group created', newGroup, res)  
}) 

const getAllGroups = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    // get all the groups for the asset 
    const assetGroup = await AssetGroupModel.find().populate('groupDetail.roomId groupDetail.detailId')
    return customResponse.successResponse('Asset groups fetched', assetGroup, res)
}) 

const getGroupDetail = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 

    const groupId = req.query.groupId as unknown as string

    // Validate groupId
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
        return customResponse.badRequestResponse('Invalid asset groupId', res);
    }

    // check if the asset group ID exists 
    const assetGroup = await AssetGroupModel.findById(groupId).populate({
        path: 'groupDetail.roomId',
        model: 'Room',
        
    })
    
    if(!assetGroup) return customResponse.badRequestResponse('There is no group with such id', res) 

    // Create a copy of the assetGroup and modify it to include detailInfo
    const modifiedAssetGroup = {
        ...assetGroup.toObject(), // Convert Mongoose document to plain object
        groupDetail: await Promise.all(assetGroup.groupDetail.map(async (detail) => {
            // Fetch the room detail for the current detailId
            const roomDetail = await RoomDetailModel.findById(detail.detailId);
            // Return the detail with detailInfo included
            return {
                roomId: detail.roomId,
                detailInfo: roomDetail ? roomDetail : null
            };
        }))
    };

    // Return the modified asset group
    return customResponse.successResponse('Asset group fetched', modifiedAssetGroup, res);  
})


export default{ 
    initialize, 
    createAssetGroup, 
    getAllGroups, 
    getGroupDetail
}