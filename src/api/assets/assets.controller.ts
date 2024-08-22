import { AuthenticatedRequest } from '../../middlewares/security';
import customResponse from "../../helpers/response";
import { Request, Response } from 'express';
import { createChildLogger } from '../../utils/childLogger';
import RoomModel, { Room } from '../../models/room';
import AssetGroupModel from '../../models/assetsGroup';
import { nodeModuleNameResolver } from 'typescript';
import mongoose from 'mongoose';
import RoomDetailModel from '../../models/roomDetail';
import { GroupDetailWithInfo } from '../../types/interface';
import catchAsync from '../../utils/catchAsync';
import AssetCleaningTask from '../../models/roomDetailCleaning';
import AssetTaskType from '../../models/roomDetailCleaning';
import WorkOrderTaskModel from '../../models/workOrderTasks';
import WorkOrderModel from '../../models/workorder';
import WorkOrderScheduleModel from '../../models/workOrderSchedule';
import TaskTypeModel from '../../models/taskType';
import FrequencyModel from '../../models/frequency';
import ManagerFacilityModel from '../../models/managerFacilities';
import { getAllAssetsForManager } from '../../services/managerAsset';
import { getLoggedInUserRoleName } from '../../utils/getLoggedInUserRoleName';
import { Roles } from '../../constant/roles';

const addAsset = catchAsync(async(req:AuthenticatedRequest, res:Response) =>{
    const {name, roomId} = req.body
    
    const session = await mongoose.startSession();
    session.startTransaction();

    // check if the roomId is valid 
    const existingRom = await RoomModel.findById(roomId).session(session)
    
    if(!existingRom){ 
        await session.abortTransaction();
        session.endSession();
        return customResponse.badRequestResponse('Invalid roomId', res)
    }
    // create the asset 
    const asset = new RoomDetailModel({ 
        name: name, 
        roomId: roomId 
    })

    const result = await asset.save({session})

    const defaultTask = await TaskTypeModel.findOne({isDefault: true}).session(session)
    if(!defaultTask){ 
        await session.abortTransaction();
        session.endSession();
        return customResponse.notFoundResponse('No task is set to default', res)
    }
    
    const defaultFrequency = await FrequencyModel.findOne({isDefault: true}).session(session)
    if(!defaultFrequency){ 
        await session.abortTransaction();
        session.endSession();
        return customResponse.notFoundResponse('No frequency is set to default', res)
    }

    if (defaultTask) {
        // Update the room frequency to the frequency of the default task
        await RoomDetailModel.updateOne(
            { _id: result._id },
            { frequency: defaultFrequency._id},
            { session }
        );
    }
  
    await AssetCleaningTask.create([{
        roomId: roomId, 
        assetId: result._id, 
        cleaningType: defaultTask._id, 
        cleaningTypeFrequency: defaultFrequency._id,
        isDefault: true
    }], { session });
    
    await session.commitTransaction();
    session.endSession();
    
    return customResponse.successResponse('asset created', asset, res)

})

const getAllAssets = catchAsync(async(req:AuthenticatedRequest, res: Response) => {
    const result = await RoomDetailModel.find().populate('roomId frequency')
    return customResponse.successResponse('fetched', result, res)
})

const getAllAssetsSchedule = catchAsync(async(req:AuthenticatedRequest, res:Response) => {
    const result = await AssetTaskType.find().populate('cleaningType cleaningTypeFrequency roomId assetId')
    return customResponse.successResponse('fetched', result, res)
})

const generalScheduleWorkOrder = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const result = await AssetTaskType.find().populate('cleaningType cleaningTypeFrequency roomId assetId')
    const filteredResult = result.filter(schedules => schedules.active)
    return customResponse.successResponse('Active schedules', filteredResult, res)
})

const getAssetSchedule = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    const {id} = req.query
    const result = await AssetTaskType.findById(id).populate('cleaningType cleaningTypeFrequency roomId assetId')
    if(!result){ 
        return customResponse.badRequestResponse("There is no asset schedule with such id", res)
    }
    return customResponse.successResponse('asset schedule', result, res)
})

//get asset schedule by roomId 
const assetScheduleByRoom = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const {roomId} = req.query
    const result = await AssetTaskType.find({roomId: roomId}).populate('cleaningType cleaningTypeFrequency')
    if(!result){
        return customResponse.badRequestResponse("There is no such room", res)
    }
    return customResponse.successResponse('asset schedule by room', result, res)
})

// get asset by roomId
const assetByRoom = catchAsync(async (req:AuthenticatedRequest, res: Response) => { 
    const {roomId} = req.query
    const result = await RoomDetailModel.find({roomId: roomId}).populate('frequency')
    if(!result){ 
        return customResponse.notFoundResponse('There are no assets in the room', res)
    }
    return customResponse.successResponse('assets in room', result, res)
})
// for every asset get the taskType
const assetDetails = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const {assetId} = req.query
    if (!assetId) {
        return customResponse.badRequestResponse('AssetId is required', res);
    }
    // const roleName = getLoggedInUserRoleName(req)
    // if(roleName == Roles.MANAGER){ 
    //     if(!facilityId){ 
    //         return customResponse.badRequestResponse('Manager must pass a facilityId to use this endpoint', res)
    //     }
    //     const managerService = await getAllAssetsForManager(req.auth.userId, facilityId as string)
    //     const assetIds = managerService.data.map(asset => asset._id.toString());
    //     if (assetIds.length === 0 || !assetIds.includes(assetId as string)) {
    //         return customResponse.badRequestResponse('Asset Id does not belong to facility', res);
    //     }
    // }
    const result = await AssetTaskType.find({assetId: assetId}).populate('cleaningType cleaningTypeFrequency')
    return customResponse.successResponse('asset details', result, res)

})

const assetTaskDetails = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const {assetTaskId} = req.query
    const result = await AssetTaskType.findById(assetTaskId).populate('cleaningType cleaningTypeFrequency')
    return customResponse.successResponse('asset task details', result, res)
})

const addTaskToAsset = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const {assetTask, roomId, assetId} = req.body

    const existingRoom = await RoomModel.findById(roomId)
    if(!existingRoom){ 
        return customResponse.notFoundResponse('There is no room with such id', res)
    }

    const existingAsset = await RoomDetailModel.findById(assetId)
    if(!existingAsset){ 
        return customResponse.notFoundResponse('There is no room with such id', res)
    }

    const existingSet = await RoomDetailModel.findOne({roomId: roomId, _id: assetId})
    if(!existingSet){ 
        return customResponse.notFoundResponse('There is no relationship between the room id and the asset id', res)
    }
    await Promise.all(assetTask.map(async (tasks: { cleaningType: mongoose.Schema.Types.ObjectId; cleaningTypeFrequency: mongoose.Schema.Types.ObjectId; }) => { 
        await AssetTaskType.create({ 
            roomId: roomId, 
            assetId: assetId, 
            cleaningType: tasks.cleaningType, 
            cleaningTypeFrequency: tasks.cleaningTypeFrequency, 
            isDefault: false, 
            active: true
        })
    }))

    return customResponse.successResponse('task added to asset', {},res)
})
// activate/ deactivate asset cleaning type
const updateAssetTaskStatus = catchAsync(async (req:AuthenticatedRequest, res: Response) => {
    const {status} = req.body
    const {assetTask} = req.query

    const session = await mongoose.startSession();
    session.startTransaction();

    const updateAssetTask = await AssetTaskType.findByIdAndUpdate(
        assetTask, 
        {active: status},
        {new: true, session}
    )

    if(!updateAssetTask){ 
        await session.abortTransaction();
        session.endSession();
        return customResponse.notFoundResponse('Asset task not found', res);
    }

    const workOrderTasksExists = await WorkOrderTaskModel.exists({assetTaskType: assetTask})

    if(workOrderTasksExists !== null){ 
        // get the distnict work orders associated and deactivate them too 
        const uniqueWorkOrders = await WorkOrderTaskModel.distinct('workOrderId', { assetTaskType: assetTask });

        // Deactivate work order tasks
        const updateWorkOrderTasks = await WorkOrderTaskModel.updateMany(
            {assetTaskType: assetTask}, 
            {active: status},
            {session}
        )
        if(!updateWorkOrderTasks){ 
            await session.abortTransaction();
            session.endSession();
            return customResponse.notFoundResponse('No work order task for this asset', res);
        }

        // Deactivate unique work orders
        const updateWorkOrders = await WorkOrderModel.updateMany(
            { _id: { $in: uniqueWorkOrders } },
            { active: status },
            { session }
        );

        if (!updateWorkOrders) {
            await session.abortTransaction();
            session.endSession();
            return customResponse.notFoundResponse('Failed to update work orders', res);
        }

        const updateWorkOrderSchedule = await WorkOrderScheduleModel.updateMany(
            {workOrderId: {$in: uniqueWorkOrders}}, 
            {active: status}, 
            {session}
        )

        if(!updateWorkOrderSchedule){ 
            await session.abortTransaction();
            session.endSession();
            return customResponse.notFoundResponse('Failed to update work orders schedule', res);
        }
    }
    
    // I want to get the unique work orders and then deactivate them

    await session.commitTransaction();
    session.endSession();

    return customResponse.successResponse('asset task updated successfully', {}, res);
})

const getAssetsByFacilityId = catchAsync(async(req:AuthenticatedRequest, res: Response) => {
    const facilityId = req.query.facilityId as unknown as string;
    await RoomDetailModel.find().populate('roomId').then(result => {
        const results = result.filter(item => {
          return (item.roomId as unknown as Room).location_id.equals(facilityId);
        });
    return customResponse.successResponse('fetched', results, res)})
})
// delete asset task -> delete all work orders and task it belongs too 

const getAllAssetsManager = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    const managerId = req.auth.userId
    const {facilityId} = req.query
    const result = await getAllAssetsForManager(managerId, facilityId as string)
    if (result.found == false) {
        return customResponse.successResponse(result.message, {}, res);
    }
    if(result.data.length == 0){ 
        return customResponse.successResponse('There is no asset in this facility', [], res)
    }
    // Extract asset IDs
    const assetIds = result.data.map(asset => asset._id);

    // Count the number of tasks for each asset in one query
    const assetTaskCounts = await AssetTaskType.aggregate([
        { $match: { assetId: { $in: assetIds } } },
        { $group: { _id: "$assetId", count: { $sum: 1 } } }
    ]);

    // Transform the result to a map for easier lookup
    const assetTaskCountMap = assetTaskCounts.reduce((map, obj) => {
        map[obj._id.toString()] = obj.count;
        return map;
    }, {});

    // Add task count to each asset
    const assetsWithTaskCount = result.data.map(asset => ({
        ...asset.toObject(),
        taskCount: assetTaskCountMap[asset._id.toString()] || 0
    }));

    return customResponse.successResponse(result.message, assetsWithTaskCount, res);
})
//     const finalResult = await Promise.all( result.data.map(async assets => { 
//         const taskCounts = await AssetTaskType.countDocuments({assetId: {$in:assets._id}})
//         return{ 
//             ...assets.toObject(),
//             taskCount: taskCounts
//         }
//     }))
   
//     return customResponse.successResponse(result.message, finalResult, res);

// })

const getAllAssetsScheduleManager = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const managerId = req.auth.userId
    const {facilityId} = req.query
    console.log('hei')
    const result = await getAllAssetsForManager(managerId, facilityId as string)
    if (result.found == false) {
        return customResponse.successResponse(result.message, {}, res);
    }
    if(result.data.length == 0){ 
        return customResponse.successResponse('No assets found', [], res)
    }
    const assetIds = result.data.map(asset => asset._id)

    // find them in the assetTaskType 
    const assetTaskType = await AssetTaskType.find({assetId: {$in: assetIds}}).populate('cleaningType cleaningTypeFrequency roomId assetId')
    return customResponse.successResponse('general schedule', assetTaskType, res)
})
export default { 
    addAsset,
    getAllAssets,
    getAllAssetsManager,
    getAllAssetsScheduleManager,
    getAllAssetsSchedule,
    getAssetSchedule,
    generalScheduleWorkOrder,
    assetScheduleByRoom,
    addTaskToAsset,
    assetDetails,
    assetTaskDetails,
    updateAssetTaskStatus,
    getAssetsByFacilityId,
    assetByRoom
}