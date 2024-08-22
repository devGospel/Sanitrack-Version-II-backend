import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/security";
import customResponse from "../../../helpers/response";

import { createChildLogger } from "../../../utils/childLogger";
import catchAsync from "../../../utils/catchAsync";
import { getAllAssetsForManager, managerFacilityCheck } from "../../../services/managerAsset";
import AssetTaskType from "../../../models/roomDetailCleaning";
import workOrderAssetTaskModel from "../../../models/workOrderAssetTask";
import RoomModel from "../../../models/room";
import RoomDetailModel from "../../../models/roomDetail";
import TaskTypeModel from "../../../models/taskType";
import FrequencyModel from "../../../models/frequency";
import WorkOrderScheduleModel from "../../../models/workOrderSchedule";
import WorkOrderAssigneeModel from "../../../models/workOrderAssignee";
import mongoose from "mongoose";
import WorkOrderModel from "../../../models/workorder";
import WorkOrderTaskModel from "../../../models/workOrderTasks";
import CleanerEvidenceModel from "../../../models/cleanerEvidence";
import CleanerGeneralEvidenceModel from "../../../models/cleanerGeneralEvidence";
import InspectorEvidenceModel from "../../../models/inspectorEvidenceNew";
import InspectorGeneralEvidenceModel from "../../../models/inspectorGeneralEvidence";
import TeamModel from "../../../models/teams";
import UserRoles from "../../../models/userRoles";

const hello = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    return customResponse.successResponse('Manager work order', "hello", res)
})

const managerMssTable = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    // get all the assets in his facility and then get their asset task so you can use it to get the data from workOrderAssetTaskModel
    const managerId = req.auth.userId
    const {facilityId} = req.query

    const managerAssetService = await getAllAssetsForManager(managerId, facilityId as string)
    if(managerAssetService.found == false){ 
        return customResponse.successResponse(managerAssetService.message, [], res)
    }
    // get all the asset
    const assetIds = managerAssetService.data.map(assets => assets._id)

    const assetTaskTypes = await AssetTaskType.find({ assetId: { $in: assetIds } }).populate('cleaningType cleaningTypeFrequency roomId assetId');

    // Extract asset task type IDs
    const assetTaskTypeIds = assetTaskTypes.map(taskType => taskType._id);

    // using the id, query again the workOrderAssetTaskModel and get the workOrder
    const workOrderAssetTask = await workOrderAssetTaskModel.find({assetTask: {$in: assetTaskTypeIds}})
    .populate('workOrderId')
    .populate({
        path: 'assetTask',
        populate: [
            {
                path: 'roomId',
                model: RoomModel
            },
            {
                path: 'assetId',
                model: RoomDetailModel
            }, 
            { 
                path: 'cleaningType', 
                model: TaskTypeModel
            }, 
            { 
                path: 'cleaningTypeFrequency',
                model: FrequencyModel
            }
        ]
    }).sort({_id: -1})

    const result = await Promise.all(workOrderAssetTask.map(async (data: any) => { 
        const workOrderSchedule = await WorkOrderScheduleModel.findOne({workOrderId: data.workOrderId._id})
        const workOrderAssignee = await WorkOrderAssigneeModel.findOne({workOrderId: data.workOrderId._id}).populate({
            path: 'team',
            select: 'teamName'
        })
        .populate({
            path: 'cleaner',
            select: 'username'
        })
        .populate({
            path: 'inspector',
            select: 'username'
        });
        return {
            workOrderId: data.workOrderId._id,
            workOrderName: data.workOrderId?.name,
            workOrderPermission: data.workOrderId?.overridePermission,
            assetTask: {
                roomId: data.assetTask?.roomId?._id,
                room: data.assetTask?.roomId?.roomName,
                asset: data.assetTask?.assetId?.name,
                assetCode: `${data.assetTask?.assetId?.assetPrefix}${data.assetTask?.assetId?.assetCode}`,
                cleaningType: data.assetTask?.cleaningType?.name,
                frequency: data.assetTask?.cleaningTypeFrequency?.name
            },
            schedule: {
                startDate: workOrderSchedule?.startDate,
                endDate: workOrderSchedule?.endDate,
                cleaningValidPeriod: workOrderSchedule?.cleaningValidPeriod,
                startHour: workOrderSchedule?.startHour,
                startMinute: workOrderSchedule?.startMinute,
            },
            assignees: {
                team: workOrderAssignee?.team,
                cleaners: workOrderAssignee?.cleaner,
                inspectors: workOrderAssignee?.inspector
            }
        };
    }))
    return customResponse.successResponse('fetched', result, res)
    // from the work order, get the schedule, assignee and the res
})

const generateMssManager = catchAsync(async (req:AuthenticatedRequest, res:Response) => {
    const managerId = req.auth.userId
    const {facilityId} = req.query

    const session = await mongoose.startSession()
    session.startTransaction();

    const managerAssetService = await getAllAssetsForManager(managerId, facilityId as string)

    if(managerAssetService.found == false){ 
        return customResponse.successResponse(managerAssetService.message, [], res)
    }
    // get all the asset
    const assetIds = managerAssetService.data.map(assets => assets._id)

    const assetTaskTypes = await AssetTaskType.find({ assetId: { $in: assetIds } }).populate('cleaningType cleaningTypeFrequency roomId assetId').session(session);

    const filteredAssetTaskTypes = assetTaskTypes.filter(schedules => schedules.active)

    // Extract asset task type IDs
    // const assetTaskTypeIds = filteredAssetTaskTypes.map(taskType => taskType._id);

    // to generate mss
    

    // for each of them, create a work order 
    await Promise.all(filteredAssetTaskTypes.map(async (assetTask: any) => { 
        
        if(!assetTask.mssActive){
            // activate mss for that asset 
            await AssetTaskType.findByIdAndUpdate(assetTask._id, {mssActive: true}, {new: true, session})

            const newWorkOrder = new WorkOrderModel({ 
                name: `${assetTask.cleaningType?.name} for ${assetTask.assetId?.name} work order`, 
            })
           
            const savedWorkOrder = await newWorkOrder.save({session})
    
            
            //save work order asset
            const newWorkOrderAsset = new workOrderAssetTaskModel({ 
                workOrderId: savedWorkOrder._id, 
                assetTask: assetTask._id
            })
           
    
            await newWorkOrderAsset.save({session})
           
    
            //save work order schedule
            const newWorkOrderSchedule = new WorkOrderScheduleModel({ 
                workOrderId: savedWorkOrder._id,
                frequency: assetTask.cleaningFrequency?._id ? assetTask.cleaningFrequency._id : null
            })
            
            await newWorkOrderSchedule.save({session})
           
    
            // generate the work order assignee too 
            const newWorkOrderAssignee = new WorkOrderAssigneeModel({ 
                workOrderId: savedWorkOrder._id
            })
          
    
            await newWorkOrderAssignee.save({session})
        }
       
        
    }))

    // If everything is fine, commit the transaction
    await session.commitTransaction();
    session.endSession()

    return customResponse.successResponse('work order generated', {}, res)
})

const resetMssManager = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        // reset mss for his facility
        const managerId = req.auth.userId
        const {facilityId} = req.query

        const managerAssetService = await getAllAssetsForManager(managerId, facilityId as string)

        if(managerAssetService.found == false){ 
            return customResponse.successResponse(managerAssetService.message, [], res)
        }

        
        // get all the asset
        const assetIds = managerAssetService.data.map(assets => assets._id)

        // get all the assetTaskType
        const assetTaskTypes = await AssetTaskType.find({ assetId: { $in: assetIds } }).session(session)
        // get the workOrder associated with the task type 
        const assetTaskTypeIds = assetTaskTypes.map(taskType => taskType._id);
        const workOrderAssetTask = await workOrderAssetTaskModel.find({assetTask: {$in: assetTaskTypeIds}}).session(session)

        await Promise.all(workOrderAssetTask.map(async (data) => {
            await WorkOrderModel.deleteMany({_id: data.workOrderId}).session(session)
            await WorkOrderScheduleModel.deleteMany({workOrderId: data.workOrderId}).session(session)
            await WorkOrderAssigneeModel.deleteMany({workOrderId: data.workOrderId}).session(session)
            await WorkOrderTaskModel.deleteMany({workOrderId: data.workOrderId}).session(session)
            await workOrderAssetTaskModel.deleteMany({workOrderId: data.workOrderId}).session(session)
            await CleanerEvidenceModel.deleteMany({workOrderId: data.workOrderId}).session(session)
            await CleanerGeneralEvidenceModel.deleteMany({workOrderId: data.workOrderId}).session(session)
            await InspectorEvidenceModel.deleteMany({workOrderId: data.workOrderId}).session(session)
            await InspectorGeneralEvidenceModel.deleteMany({workOrderId: data.workOrderId}).session(session)
        }))
        // update the assetTaskType
        await Promise.all(assetTaskTypes.map(async (assets) => {
            await AssetTaskType.findByIdAndUpdate(
                assets._id,
                { mssActive: false },
                { new: true, session }
            );
        }));

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return customResponse.successResponse('Mss reset', {}, res)
    }catch(error:any){ 
        console.log(error)
        await session.abortTransaction();
        session.endSession();

        return customResponse.serverErrorResponse('Failed to reset MSS', res, error);
    }
    

})

const availableTeam = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    // get all the team
    const {facilityId} = req.query
    if(!facilityId || !mongoose.Types.ObjectId.isValid(facilityId as string)){ 
        return customResponse.badRequestResponse('The facilityId is required', res)
    }
    const managerId = req.auth.userId
    const managerService = await managerFacilityCheck(managerId, facilityId as string)
    if(!managerService.found){
        return customResponse.badRequestResponse(managerService.message, res)
    }
    const teams = await TeamModel.find({facilityId:facilityId}).select('teamName ')
    if(!teams){ 
        return customResponse.createResponse('No team in this facility', {}, res)
    }
    // build data structure for team assignment 
    const teamAssignment = await Promise.all(teams.map(async (team) => { 
        // fetch the work order the team is assigned to 
        const workOrders = await WorkOrderAssigneeModel.find({team: {$in: team}})

        // extract the roomId and the startHour from the task and workSchedule 
        const assignments = await Promise.all(workOrders.map(async(assignment) => { 
            const schedule = await WorkOrderScheduleModel.findOne({workOrderId: assignment.workOrderId, active: true})
            const tasks = await WorkOrderTaskModel.findOne({workOrderId: assignment.workOrderId, active: true})

            return{ 
                roomId: tasks?.roomId,
                startHour: schedule?.startHour
            }
        }))

        return{ 
            team, 
            assignments
        }
    }))

    // Filter based on availability
    const {roomId, startHour} = req.body
    if(!roomId || !startHour){ 
        return customResponse.badRequestResponse('The roomId and startHour is required',res)
    }
    const roomIdCheck = await RoomModel.findOne({location_id: facilityId, _id: roomId})
    if(!roomIdCheck){ 
        return customResponse.notFoundResponse('The room passed does not belong to the facility', res)
    }
    const availableTeams = teamAssignment.map(({ team, assignments }) => {
        const isAvailable = !assignments.some(assignment => assignment.roomId == roomId && assignment.startHour == startHour);
        return {
          ...team.toObject(), // Convert Mongoose document to plain object if needed
          isAvailable
        };
      });
    return customResponse.successResponse('team assignment', availableTeams, res)
})

const availableInspector = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    // get all the inspectors who have not been fired
    const {facilityId} = req.query
    if(!facilityId || !mongoose.Types.ObjectId.isValid(facilityId as string)){ 
        return customResponse.badRequestResponse('The facilityId is required', res)
    }
    const managerId = req.auth.userId
    const managerService = await managerFacilityCheck(managerId, facilityId as string)
    if(!managerService.found){
        return customResponse.badRequestResponse(managerService.message, res)
    }

    const result = await UserRoles.find({role_name: "Inspector"}).populate({
        path: 'user_id',
        match: { flag: 'ACTIVE' }, // Filter out users who are not active (i.e., not fired)
        select: 'username email flag' // Select only the fields you need
    })
    // Filter out entries where the user is not populated (because they are not active)
    const activeInspectors = result.filter(role => role.user_id !== null);
    if(!activeInspectors){ 
        return customResponse.successResponse('There are no active inspectors', {}, res)
    }

    // build data structure for the inspector assignment 
    const inspectorAssignment = await Promise.all(activeInspectors.map(async (inspectors) => { 
        // fetch work order the inspector has been assigned to 
        const workOrders = await WorkOrderAssigneeModel.find({inspector: {$in: inspectors.user_id._id}})

        // extract the roomId and startHour from the schedule and task 
        const assignments = await Promise.all(workOrders.map(async(assignment) => { 
            const task = await WorkOrderTaskModel.findOne({workOrderId: assignment.workOrderId , active: true})
            const schedule = await WorkOrderScheduleModel.findOne({workOrderId: assignment.workOrderId, active: true})

            return{ 
                roomId: task?.roomId,
                startHour: schedule?.startHour
            }
        }))
        return { 
            inspectors,
            assignments
        }
    }))

    // Filter based on availability
    const {roomId, startHour} = req.body
    if(!roomId || !startHour){ 
        return customResponse.badRequestResponse('The roomId and startHour is required',res)
    }
    const roomIdCheck = await RoomModel.findById(roomId)
    if(!roomIdCheck){ 
        return customResponse.notFoundResponse('There is no room with such id', res)
    }
    const availableInspectors = inspectorAssignment.map(({ inspectors, assignments }) => {
        const isAvailable = !assignments.some(assignment => assignment.roomId == roomId && assignment.startHour == startHour);
        return {
          ...inspectors.toObject(), // Convert Mongoose document to plain object if needed
          isAvailable
        };
      });
    return customResponse.successResponse('Available Inspectors', availableInspectors, res)
})

export default{ 
    hello, 
    managerMssTable,
    generateMssManager,
    resetMssManager,
    availableTeam,
    availableInspector
}