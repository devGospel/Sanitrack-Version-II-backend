import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import customResponse from "../../helpers/response";

import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import { getLoggedInUserRoleName } from "../../utils/getLoggedInUserRoleName";
import WorkOrderAssigneeModel, { WorkOrderAssignee } from "../../models/workOrderAssignee";
import WorkOrderModel from "../../models/workorder";
import WorkOrderTaskModel from "../../models/workOrderTasks";
import mongoose from "mongoose";
import InspectorEvidenceModel from "../../models/inspectorEvidenceNew";
import InspectorGeneralEvidenceModel from "../../models/inspectorGeneralEvidence";
import { getCurrentDateInLosAngeles, getCurrentDateInLosAngelesFormatted } from "../../utils/date";
import RoomModel from "../../models/room";
import FrequencyModel from "../../models/frequency";
import TaskTypeModel from "../../models/taskType";
import WorkOrderScheduleModel from "../../models/workOrderSchedule";
import { Evidence } from "../../types/interface";
import cloudinary from "../../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { cloudinaryAsset } from "../../constant/cloudinaryAsset";
import { insertEvidence } from "../inspector/inspector.util";
import RoomDetailModel from "../../models/roomDetail";
import { EvidenceLevel } from "../../models/evidenceLevel";
import AssetTaskType from "../../models/roomDetailCleaning";
import CertificationModel from "../../models/certification";
import { facilityInspectorCheck } from "../../services/inspectorCheck";
import CleanerEvidenceModel from "../../models/cleanerEvidence";

const moduleName = '[inspector V1/controller]'
const Logger = createChildLogger(moduleName)

const getWorkOrder = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const userId = req.auth.userId
    const facilityId = req.query.facilityId;

    if (!facilityId) {
        return customResponse.badRequestResponse('Facility ID is required', res);
    }

    const isAssociated = await facilityInspectorCheck(userId, facilityId as string)
    if(!isAssociated.found){
        return customResponse.badRequestResponse(isAssociated.message, res)
    }
    const losAngelesDate = getCurrentDateInLosAngeles()
    const losAngelesDateFormatted = losAngelesDate.setHours(0, 0, 0, 0)
    const losAngelesEndOfDay = losAngelesDate.setHours(23, 59, 59, 999)
    
    const seenRoomIds = new Set();

    // from the workOrderAssignee get the work order name for that cleaner 
    const workOrderAssigned = await WorkOrderAssigneeModel.find({inspector: {$in: userId}}).populate('workOrderId').select('-team -cleaner -inspector')
    // get the unique work order Id
    const uniqueWorkOrderIds = new Set(workOrderAssigned.map(item => item.workOrderId));
    // Convert the Set to an array if needed
    const uniqueWorkOrderIdsArray = [...uniqueWorkOrderIds];
    // find one work order task with the work order id where the valid cleaning period is for the current day 
    const rooms = await Promise.all(uniqueWorkOrderIdsArray.map(async (unique) => { 
        const workOrderTask = await WorkOrderTaskModel.findOne({workOrderId: unique,validCleaningPeriod: {$gte: losAngelesDateFormatted,$lt: losAngelesEndOfDay}, isApproved: false, active:true}).populate(({
                path: 'roomId',
                match: {location_id: facilityId}
            })).select('-assetId -assetTaskType -exclude -isDone -isApproved -active -scheduledDate -validCleaningPeriod')
        // console.log(`work order task => ${workOrderTask}`)
        if (workOrderTask && workOrderTask.roomId) {
            if (!seenRoomIds.has(workOrderTask.roomId.toString())) {
                seenRoomIds.add(workOrderTask.roomId.toString());
                return {
                    roomId: workOrderTask.roomId
                };
            }
        }
        return null;
    }))
    // Filter out any null values from the results
    const uniqueRooms = rooms.filter(room => room !== null);
    return customResponse.successResponse('work order', uniqueRooms, res)
})

const getAssetTask = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    // get the work order id and using that, get the asset tasks
    const {roomId} = req.query
    const cleanerId = req.auth.userId
    const losAngelesDate = getCurrentDateInLosAngeles()
    const losAngelesDateFormatted = losAngelesDate.setHours(0, 0, 0, 0)
    const losAngelesEndOfDay = losAngelesDate.setHours(23, 59, 59, 999)

    const existingRoom = await RoomModel.findById(roomId)
    if(!existingRoom){ 
        return customResponse.notFoundResponse('Room not found', res)
    }

     // get the workOrder details first 
     const staffWorkOrders = await WorkOrderAssigneeModel.find({inspector: {$in: cleanerId}})
     if (!staffWorkOrders || staffWorkOrders.length === 0) {
         return customResponse.successResponse('No tasks assigned to the Inspector for this room', [], res);
     }

     const allWorkOrderTask = await Promise.all(staffWorkOrders.map(async (staffWorkOrder) => {
      
        
        const workOrder = await WorkOrderTaskModel.findOne({roomId: roomId, workOrderId: staffWorkOrder.workOrderId, validCleaningPeriod: {$gte: losAngelesDateFormatted,
            $lt: losAngelesEndOfDay}, isApproved: false, active:true})
            .populate({ 
            path: 'assetId',
            select: 'name'
        }).populate({
            path: 'assetTaskType', 
            populate: [
                { 
                    path: 'cleaningTypeFrequency', 
                    model: FrequencyModel
                }, 
                { 
                    path: 'cleaningType', 
                    model: TaskTypeModel
                }
            ]
        }).select('-exclude -isDone -isApproved -lastCleaned -validCleaningPeriod')
        if(workOrder){ 
            return { 
                workOrderId: workOrder.workOrderId,
                workOrderTaskId: workOrder._id, 
                workOrder: workOrder
            }
        }
        return null

    }))

    const filteredTasks = allWorkOrderTask.filter(task => task !== null);

    if (filteredTasks.length === 0) {
        return customResponse.successResponse('No tasks found for the Inspector in this room', [], res);
    }

    const uniqueWorkOrderIds = new Set(filteredTasks.map(item => item?.workOrderId))
    const uniqueWorkOrderIdsArray = [...uniqueWorkOrderIds]

    const workOrderIdsAndAssetIds = filteredTasks.map(item => ({
        workOrderId: item?.workOrderId,
        workOrderTaskId: item?.workOrderTaskId, // Assuming workOrderTask is populated
    }));

    // console.log(workOrderIdsAndAssetIds)

    // get the schedule for the work order 
    const workOrderSchedule = await Promise.all(uniqueWorkOrderIdsArray.map(async (unique) => { 
        const result = await WorkOrderScheduleModel.findOne({workOrderId: unique})
        return result
    }))

    // get the image and public_url for the work order if there any 
    const workOrderImageForCleaner = await Promise.all(workOrderIdsAndAssetIds.map(async (details) => { 
        const result = await InspectorEvidenceModel.findOne({
            workOrderId: details.workOrderId,
            workOrderTaskId: details.workOrderTaskId,
            inspector: cleanerId,
            'evidence.images.uploadedAt': {
                $gte: losAngelesDateFormatted,
                $lte: losAngelesEndOfDay
            }
        });
        if (!result) {
            return null;
        }
        return result;
    }))

    // get the cleaners image for the task 
    const cleanerImages = await await Promise.all(workOrderIdsAndAssetIds.map(async (details) => { 
        const result = await CleanerEvidenceModel.find({
            workOrderId: details.workOrderId,
            workOrderTaskId: details.workOrderTaskId,
            'evidence.images.uploadedAt': {
                $gte: losAngelesDateFormatted,
                $lte: losAngelesEndOfDay
            },
        }).populate('cleaner');
        if (!result) {
            return null;
        }
         // Add the canDelete property to each item in the result
        const updatedResult = result.map(item => ({
            ...item.toObject(),  
            canDelete: false 
        }));

        return updatedResult;
    }))
    // Filter out null and empty results
    const filteredWorkOrderImageForCleaner = workOrderImageForCleaner.filter(item => item !== null);
    const filteredCleanerImage = cleanerImages.filter(item => item?.length !== 0)

    console.log(filteredCleanerImage)
    const combinedResults = filteredTasks.map(workOrder => {
        const schedule = workOrderSchedule.find(schedule => schedule?.workOrderId.equals(workOrder?.workOrderId));
        const evidenceDetails = filteredWorkOrderImageForCleaner.find(details => details?.workOrderId.equals(workOrder?.workOrderId))

        // Map to find the specific cleaner evidence by workOrderId
        const cleanerEvidence = filteredCleanerImage.map(item => 
            item?.find(details => details.workOrderId.equals(workOrder?.workOrderId))
        );

        // Remove any `undefined` results that may occur if no matching workOrderId is found
        const finalCleanerEvidence = cleanerEvidence.filter(evidence => evidence !== undefined);

        return {
            details: workOrder,
            workOrderSchedule: schedule,
            workOrderEvidence: evidenceDetails,
            cleanerEvidence: finalCleanerEvidence
        };
    });
    


    return customResponse.successResponse('tasks fetched', combinedResults, res)
})

const uploadEvidence = catchAsync(async(req: AuthenticatedRequest, res: Response) => { 
    const cleaner = req.auth.userId
    const {workOrderId} = req.body
    const {workOrderTaskId} = req.query
    const note = req.body.note
    const image = req.file as unknown as Express.Multer.File
    let cleanerEvidenceId:string = ''
    

    let imageUploaded = false
    let newImage = {}

    // check if the correct ids were passed 
    const existingWorkOrderId = await WorkOrderModel.findById(workOrderId)
    if(!existingWorkOrderId){ 
        return customResponse.notFoundResponse('Invalid work order id passed', res)
    }

    const existingWorkOrderTaskId = await WorkOrderTaskModel.findById(workOrderTaskId)
    if(!existingWorkOrderTaskId){ 
        return customResponse.notFoundResponse('Invalid work order task id passed', res)
    }
    // for the work order check if they have exceeded their limit 
    const workOrderEvidenceLevel = existingWorkOrderId.evidenceLevel as Partial<EvidenceLevel>;

    if (workOrderEvidenceLevel && workOrderEvidenceLevel.maxValue !== undefined) {
        const date = getCurrentDateInLosAngelesFormatted(); // Format as YYYY-MM-DD
        const maxEvidence = workOrderEvidenceLevel.maxValue as number;
        
        // Get the total number of evidence uploaded for the work order
        const cleanerEvidenceCheck = await InspectorEvidenceModel.findOne({
            workOrderId: workOrderId,
            workOrderTaskId: workOrderTaskId,
            $or: [
                { 'evidence.images.uploadedAt': { $gte: new Date(`${date}T00:00:00.000Z`), $lte: new Date(`${date}T23:59:59.999Z`) } },
                { 'evidence.notes.uploadedAt': { $gte: new Date(`${date}T00:00:00.000Z`), $lte: new Date(`${date}T23:59:59.999Z`) } }
            ]
        });
        if(cleanerEvidenceCheck){ 
            const imageCount = cleanerEvidenceCheck.evidence?.images?.length == undefined ? 0 : cleanerEvidenceCheck.evidence.images.length
            if(imageCount >= maxEvidence){ 
                return customResponse.badRequestResponse(`You can only upload ${maxEvidence} images for this work order`, res)
            }
        }
    }
    if(image !== undefined){ 
        const uploadResult = await new Promise<UploadApiResponse >((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: `${cloudinaryAsset.inspectorFolder}`,
                public_id: `${image.originalname.split('.')[0]}_${Date.now()}`, // Use original name without extension
                resource_type: 'image',
            }, (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error("Upload result is undefined")); // Handle potential undefined
                resolve(result as UploadApiResponse); // Assert the result as UploadApiResponse
            }).end(image.buffer);
        });
        // Save uploaded image details to MongoDB
        newImage = {
            url: uploadResult.secure_url,
            public_url: uploadResult.public_id,
            uploadedAt: getCurrentDateInLosAngeles(),
        };
        imageUploaded = true
    }
    

    // console.log(uploadResult)
    
    

    cleanerEvidenceId = await insertEvidence(workOrderId, workOrderTaskId as unknown as string, cleaner, imageUploaded, newImage, note) as unknown as string
    // get the url and public id for the work order that was just uploaded 
    const result = await InspectorEvidenceModel.findById(cleanerEvidenceId)
    return customResponse.successResponse('Evidence uploaded successfully.', result, res)

})

const deleteEvidence = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const {workOrderEvidenceId} = req.query
    const {publicId} = req.body
    // find the work order evidence id 
    const result = await InspectorEvidenceModel.findById(workOrderEvidenceId)
    if(!result){ 
        return customResponse.notFoundResponse('There is no cleaner evidence with such id ', res)
    }
    // using the publicId get the public id from the images they want to delete 
    const imageEvidence = await InspectorEvidenceModel.updateOne(
        {_id: workOrderEvidenceId},
        {
            $pull: {
                "evidence.images": {public_url: publicId}
            }
        }
    )

    if(imageEvidence.modifiedCount > 0){ 
        try {
            const cloudinaryResponse = await cloudinary.uploader.destroy(publicId);
            // if (cloudinaryResponse.result === 'ok') {
            //     return res.status(200).json({ message: 'Image evidence deleted successfully from both the database and Cloudinary.' });
            // } else {
            //     return res.status(500).json({ message: 'Image was not found on Cloudinary or could not be deleted.' });
            // }
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting image from Cloudinary', error });
        }
    }

    const updatedEvidence = await InspectorEvidenceModel.findById(workOrderEvidenceId)
    return customResponse.successResponse('Image deleted', updatedEvidence, res)

})

const approveTasks = catchAsync(async(req: AuthenticatedRequest, res: Response) => { 
    const {tasks} = req.body
    let updateCount = 0 
    const losAngelesDate = getCurrentDateInLosAngeles()
    const session = await mongoose.startSession()
    session.startTransaction()

    const result = await Promise.all(tasks.map(async (taskDetails: { task_id: mongoose.Types.ObjectId; status: Boolean; }) => {
        // update each of the taskDetails.workOrderId 
        const existingTask = await WorkOrderTaskModel.findById(taskDetails.task_id).session(session)
        if(!existingTask){ 
            return customResponse.notFoundResponse('Invalid task id passed', res)
        }
        // update the task status (isDone and isApproved)
        const update = await WorkOrderTaskModel.findByIdAndUpdate(taskDetails.task_id,
            {isDone: taskDetails.status, isApproved: taskDetails.status, lastCleaned:losAngelesDate}, 
            {new: true, session}
        )
        return update
        
    }))
    
    await session.commitTransaction()
    session.endSession()
    return customResponse.successResponse('Approved tasks submitted', result, res)
    
})

const mssTable = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    // get data for the supervisor where he is assigned to the work order 
    const inspector = req.auth.userId 
    const facilityId = req.query.facilityId

    const workOrderAssignee = await WorkOrderAssigneeModel.find({inspector: {$in: [inspector]}}) 
    if(!workOrderAssignee){ 
        return customResponse.successResponse('No work order has been assigned to you', {}, res)
    }
    // console.log('ffff', workOrderAssignee)
    const workOrderIds:mongoose.Types.ObjectId[] = workOrderAssignee.map(workOrder => workOrder.workOrderId);
    console.log(workOrderIds)
    // based on the work order id, feed the table
    const inspectorMss = await Promise.all(workOrderIds.map(async(workOrders) => { 
        // get the workOrderSchedule 
        const workOrderSchedule = await WorkOrderScheduleModel.findOne({workOrderId: workOrders})
        const workOrderAssignees = await WorkOrderAssigneeModel.findOne({workOrderId: workOrders}).populate({
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
        const workOrderDetails = await WorkOrderModel.findById(workOrders)
        const workOrderTask:any = await WorkOrderTaskModel.findOne({workOrderId: workOrders}).populate({
            path: 'roomId',
            model: RoomModel,
            match: {location_id: facilityId}
        }).populate({
            path: 'assetId',
            model: RoomDetailModel
        }).populate({
            path: 'assetTaskType',
            model: AssetTaskType,
            populate: [
                {
                    path: 'cleaningType',
                    model: TaskTypeModel
                },
                {
                    path: 'cleaningTypeFrequency',
                    model: FrequencyModel
                },
                {
                    path: 'certification',
                    model: CertificationModel
                }
            ]
        })
        
        return{ 
            workOrderId: workOrders,
            workOrderName: workOrderDetails?.name, 
            workOrderPermission: workOrderDetails?.overridePermission,
            assetTask: { 
                roomId: workOrderTask?.roomId?._id, 
                room: workOrderTask?.roomId?.roomName, 
                asset: workOrderTask?.assetId?.name,
                assetCode: `${workOrderTask?.assetId.assetPrefix}${workOrderTask?.assetId.assetCode}`,
                cleaningType: workOrderTask.assetTaskType.cleaningType?.name,
                frequency: workOrderTask.assetTaskType.cleaningTypeFrequency?.name
            },
            schedule: {
                startDate: workOrderSchedule?.startDate,
                endDate: workOrderSchedule?.endDate,
                cleaningValidPeriod: workOrderSchedule?.cleaningValidPeriod,
                startHour: workOrderSchedule?.startHour,
                startMinute: workOrderSchedule?.startMinute
            },
            assignees: {
                team: workOrderAssignees?.team,
                cleaners: workOrderAssignees?.cleaner,
                inspectors: workOrderAssignees?.inspector
            }
        }
    }))
    return customResponse.successResponse('Inspector mss table', inspectorMss, res)
})
export default{ 
    getWorkOrder,
    getAssetTask, 
    uploadEvidence, 
    approveTasks, 
    deleteEvidence, 
    mssTable
}