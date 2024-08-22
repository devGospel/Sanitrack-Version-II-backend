import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/security";
import customResponse from "../../../helpers/response";
import { createChildLogger } from "../../../utils/childLogger";
import catchAsync from "../../../utils/catchAsync";
import RoomDetailModel from "../../../models/roomDetail";
import WorkOrderTaskModel from "../../../models/workOrderTasks";
import WorkOrderModel from "../../../models/workorder";
import RoomModel from "../../../models/room";
import CleaningItems from "../../../models/cleaningItems";
import User from "../../../models/user";
import { getLoggedInUserRoleName } from "../../../utils/getLoggedInUserRoleName";
import { Roles } from "../../../constant/roles";
import { getAllAssetsForManager } from "../../../services/managerAsset";
import mongoose from "mongoose";
import { getAllCleaners, getAllInspectors, managerCleaners, managerInspector } from "../../../services/staffs";

const moduleName = '[overview dashboard V1/controller]'
const Logger = createChildLogger(moduleName)

const getCardDetails = catchAsync(async (req:AuthenticatedRequest, res: Response) => { 
    const {facilityId} = req.query
    let allWorkOrdersCount;
    let allRoomsCount;
    let allAssetsCount;
    let allCleaners
    let cleanerData
    let inspectorData
    const allCleaningItemsCount = await CleaningItems.countDocuments();

    const role = getLoggedInUserRoleName(req)
    if(role == Roles.ADMIN){ 
        allWorkOrdersCount = await WorkOrderTaskModel.countDocuments()
        allRoomsCount  = await RoomModel.countDocuments()
        allAssetsCount = await RoomDetailModel.countDocuments()
        cleanerData = await getAllCleaners()
        inspectorData = await getAllInspectors()
    }else{ 
        if(!facilityId){ 
            return customResponse.badRequestResponse('Facility Id is needed for this endpoint as a manager', res)
        }
        // for the work order tasks, get the total assetIds for the facility and count the number of tasks the assetid have
        const managerAssetService = await getAllAssetsForManager(req.auth.userId as mongoose.Types.ObjectId, facilityId as string)
        if(!managerAssetService.found){
            allWorkOrdersCount = 0
            allAssetsCount = 0
        }
        const assetIds = managerAssetService.data.map(item => item._id)
        // for each of the assetIds count the number of workOrderTaskModel that has an assetId 
        allWorkOrdersCount = await WorkOrderTaskModel.countDocuments({assetId: {$in: assetIds}})

        // get the total number of rooms in the facility 
        allRoomsCount = await RoomModel.countDocuments({location_id: facilityId})

        // get the total number of assets in the facility
        allAssetsCount = managerAssetService.data.length

        // get the manager cleaners
        cleanerData = await managerCleaners(req.auth.userId as mongoose.Types.ObjectId, facilityId as string)

        // get the manager inspectors
        inspectorData = await managerInspector(req.auth.userId as mongoose.Types.ObjectId, facilityId as string)
    }
    const data = {
        workOrders: allWorkOrdersCount,
        rooms: allRoomsCount,
        assets: allAssetsCount,
        cleaningItems: allCleaningItemsCount, 
        allCleaners: cleanerData.totalCleaners, 
        allInspectors: inspectorData.totalInspectors
    };
    return customResponse.successResponse('card details', data, res)
})

export default{ 
    getCardDetails
}