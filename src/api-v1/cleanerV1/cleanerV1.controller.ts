import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import customResponse from "../../helpers/response";

import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import { getLoggedInUserRoleName } from "../../utils/getLoggedInUserRoleName";
import WorkOrderAssigneeModel from "../../models/workOrderAssignee";
import WorkOrderModel from "../../models/workorder";
import WorkOrderTaskModel from "../../models/workOrderTasks";
import RoomModel from "../../models/room";
import RoomDetailModel from "../../models/roomDetail";
import mongoose from "mongoose";
import CleanerEvidenceModel from "../../models/cleanerEvidence";
import CleanerGeneralEvidenceModel from "../../models/cleanerGeneralEvidence";
import { endOfDayInLosAngeles, getCurrentDateInLosAngeles, getCurrentDateInLosAngelesFormatted } from "../../utils/date";
import { populate } from "dotenv";
import FrequencyModel from "../../models/frequency";
import WorkOrderScheduleModel from "../../models/workOrderSchedule";
import TaskTypeModel from "../../models/taskType";
import cloudinary from "../../config/cloudinary";
import { CloudinaryUploadResult, Evidence } from "../../types/interface";
import { UploadApiResponse } from "cloudinary";
import { cloudinaryAsset } from "../../constant/cloudinaryAsset";
import { insertEvidence } from "./cleaner.util";
import { EvidenceLevel } from "../../models/evidenceLevel";
import { facilityCleanerCheck } from "../../services/cleanerCheck";

const moduleName = '[cleanerNew/controller]'
const Logger = createChildLogger(moduleName)

const helloCleanerV1 = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    return customResponse.successResponse('hello', {}, res)
})

const getWorkOrder = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    // get the role of the logged in user
    const roleName = getLoggedInUserRoleName(req)
    const userId = req.auth.userId
    const facilityId = req.query.facilityId;

    if (!facilityId) {
        return customResponse.badRequestResponse('Facility ID is required', res);
    }

    const isAssociated = await facilityCleanerCheck(userId, facilityId as string)
    if(!isAssociated.found){
        return customResponse.badRequestResponse(isAssociated.message, res)
    }
    const losAngelesDate = getCurrentDateInLosAngeles()
    const losAngelesDateFormatted = losAngelesDate.setHours(0, 0, 0, 0)
    const losAngelesEndOfDay = losAngelesDate.setHours(23, 59, 59, 999)
    
    const seenRoomIds = new Set();

    Logger.info(` the time in los angeles is ${losAngelesDate}`)
    // from the workOrderAssignee get the work order name for that cleaner 
    const workOrderAssigned = await WorkOrderAssigneeModel.find({cleaner: {$in: userId}}).populate('workOrderId').select('-team -cleaner -inspector')
    // get the unique work order Id
    // console.log(`cleaner work orders => ${workOrderAssigned.map(item => item.workOrderId)}`)
    const uniqueWorkOrderIds = new Set(workOrderAssigned.map(item => item.workOrderId));
    // Convert the Set to an array if needed
    const uniqueWorkOrderIdsArray = [...uniqueWorkOrderIds];
    // console.log('After converting to an array ', uniqueWorkOrderIdsArray)

    // find one work order task with the work order id where the valid cleaning period is for the current day 
    const rooms = await Promise.all(uniqueWorkOrderIdsArray.map(async (unique: any) => { 
        const workOrderTask:any = await WorkOrderTaskModel.findOne({workOrderId: unique, validCleaningPeriod: {$gte: losAngelesDateFormatted,$lt: losAngelesEndOfDay}, isDone: false, active:true}).populate(({
                path: 'roomId', 
                match: {location_id: facilityId}
            })).select('-assetId -assetTaskType -exclude -isDone -isApproved -active -scheduledDate -validCleaningPeriod')
        console.log(`work order that matches facility => ${workOrderTask}`)
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


//get the asset task in work order
const getAssetTask = catchAsync(async (req:AuthenticatedRequest,res:Response) => { 
    // get the work order id and using that, get the asset tasks
    const {roomId} = req.query
    const {isScanned} = req.body
    const cleanerId = req.auth.userId
    const losAngelesDate = getCurrentDateInLosAngeles()
    const losAngelesDateFormatted = losAngelesDate.setHours(0, 0, 0, 0)
    const losAngelesEndOfDay = losAngelesDate.setHours(23, 59, 59, 999)
   

    const existingRoom = await RoomModel.findById(roomId)
    if(!existingRoom){ 
        return customResponse.notFoundResponse('Room not found', res)
    }
    // get the workOrder details first 
    const staffWorkOrders = await WorkOrderAssigneeModel.find({cleaner: {$in: cleanerId}})
    if (!staffWorkOrders || staffWorkOrders.length === 0) {
        return customResponse.successResponse('No tasks assigned to the cleaner for this room', [], res);
    }

    const allWorkOrderTask = await Promise.all(staffWorkOrders.map(async (staffWorkOrder) => {
      
        console.log(`staff work order => ${staffWorkOrder.workOrderId}`)
        const workOrder = await WorkOrderTaskModel.findOne({roomId: roomId, workOrderId: staffWorkOrder.workOrderId, validCleaningPeriod: {$gte: losAngelesDateFormatted,
            $lt: losAngelesEndOfDay}, isDone: false, isApproved: false, active:true})
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
        console.log(workOrder)
        if(workOrder){ 
            return { 
                workOrderId: workOrder.workOrderId,
                workOrderTaskId: workOrder._id, 
                workOrder: workOrder
            }
        }
        return null

    }))

    // add a filter to get the workOrderId and then check if the person logged in assigned 

    const filteredTasks = allWorkOrderTask.filter(task => task !== null);

    if (filteredTasks.length === 0) {
        return customResponse.successResponse('No tasks found for the cleaner in this room', [], res);
    }

    const uniqueWorkOrderTaskIds = new Set(filteredTasks.map(item => item?.workOrderTaskId))
    // const uniqueWorkOrderTaskIdsArray = [...uniqueWorkOrderTaskIds]

    // // put into the Staff start time if the isScanned is true 
    // if(isScanned){ 

    // }

    const uniqueWorkOrderIds = new Set(filteredTasks.map(item => item?.workOrderId))
    const uniqueWorkOrderIdsArray = [...uniqueWorkOrderIds]

   

    const workOrderIdsAndAssetIds = filteredTasks.map(item => ({
        workOrderId: item?.workOrderId,
        workOrderTaskId: item?.workOrderTaskId, // Assuming assetId is populated
    }));

    // console.log(workOrderIdsAndAssetIds)

    // get the schedule for the work order 
    const workOrderSchedule = await Promise.all(uniqueWorkOrderIdsArray.map(async (unique) => { 
        const result = await WorkOrderScheduleModel.findOne({workOrderId: unique})
        return result
    }))

    // get the image and public_url for the work order if there any 
    const workOrderImageForCleaner = await Promise.all(workOrderIdsAndAssetIds.map(async (details) => { 
        const result = await CleanerEvidenceModel.findOne({
            workOrderId: details.workOrderId,
            workOrderTaskId: details.workOrderTaskId,
            cleaner: cleanerId,
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

    // Filter out null and empty results
    const filteredWorkOrderImageForCleaner = workOrderImageForCleaner.filter(item => item !== null);


    const combinedResults = filteredTasks.map(workOrder => {
        const schedule = workOrderSchedule.find(schedule => schedule?.workOrderId.equals(workOrder?.workOrderId));
        const evidenceDetails = filteredWorkOrderImageForCleaner.find(details => details?.workOrderId.equals(workOrder?.workOrderId))

        return {
            details: workOrder,
            workOrderSchedule: schedule,
            workOrderEvidence: evidenceDetails
        };
    });
    


    return customResponse.successResponse('tasks fetched', combinedResults, res)
    // if(assignToIndividual){ 
    //     // get the asset task assigned to the logged in user 
    //     const cleanerTask = await WorkOrderTaskModel.find({workOrderId: workOrderId, assignedCleaner: cleanerId, validCleaningPeriod: {$gte: losAngelesDate, $lte: endOfDayLosAngeles}}).populate({
    //         path: 'roomId',
    //         select: 'roomName'
    //     }).populate({ 
    //         path: 'assetId',
    //         select: 'name, frequency'
    //     }).select('-exclude -isDone -isApproved -lastCleaned -validCleaningPeriod')
    //     if(cleanerTask.length == 0){
    //         return customResponse.successResponse('A task was not assigned to you under this work order for this day',[], res)
    //     }
    //     return customResponse.successResponse('cleaner specific task', cleanerTask, res)
    // }else{   
    //     const scheduledWorkOrder = await WorkOrderTaskModel.find({workOrderId: workOrderId, validCleaningPeriod: {$gte: losAngelesDate, $lte: endOfDayLosAngeles}}).populate({
    //         path: 'roomId',
    //         select: 'roomName'
    //     }).populate({ 
    //         path: 'assetId',
    //         select: 'name ',
    //     }).select('-exclude -isDone -isApproved -lastCleaned -validCleaningPeriod')
    //     if(scheduledWorkOrder.length == 0){ 
    //         return customResponse.successResponse('There is no task within the valid cleaning period', {}, res)
    //     }
    //     return customResponse.successResponse('cleaner task', scheduledWorkOrder, res)        
    // }
    
})

// On the Ui, every time they upload an array of individual images for the assets in the work order, the api is called 
// to update the cleaner evidence 
// not checking if a cleaner has cleaned a work order before because a workOrderId in the cleaner evidence model could be tied to work order task but they fall on diffcerence days
const uploadEvidence = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    // if the work order was assigned to a team, the evidence is set for all the cleaners and assigned inspectors 
   
    const cleaner = req.auth.userId
    const {workOrderId} = req.body
    const note = req.body.note
    const {workOrderTaskId} = req.query
    const image = req.file as unknown as Express.Multer.File
    let cleanerEvidenceId:string = ''
    

    let imageUploaded = false
    let newImage = {}

    // check if the correct ids were passed 
    const existingWorkOrderId = await WorkOrderModel.findById(workOrderId).populate('evidenceLevel')
    if(!existingWorkOrderId){ 
        return customResponse.notFoundResponse('Invalid work order id passed', res)
    } 
    // commenting this because I do not know why it is resulting in an error 

    // console.log(`the work order is => ${existingWorkOrderId}`)
    
    const existingWorkOrderTaskId = await WorkOrderTaskModel.findById(workOrderTaskId)
    if(!existingWorkOrderTaskId){ 
        return customResponse.notFoundResponse('Invalid work order task id passed', res)
    }

    const workOrderTaskIdCheck = await WorkOrderTaskModel.findOne({_id: workOrderTaskId, workOrderId: workOrderId})
    if(!workOrderTaskIdCheck){ 
        return customResponse.notFoundResponse('There is no relationship between the taskId and the work order id', res)
    }
    
    // for the work order check if they have exceeded their limit 
    const workOrderEvidenceLevel = existingWorkOrderId.evidenceLevel as Partial<EvidenceLevel>;

    if (workOrderEvidenceLevel && workOrderEvidenceLevel.maxValue !== undefined) {
        const date = getCurrentDateInLosAngelesFormatted(); // Format as YYYY-MM-DD
        const maxEvidence = workOrderEvidenceLevel.maxValue as number;
        
        // Get the total number of evidence uploaded for the work order
        const cleanerEvidenceCheck = await CleanerEvidenceModel.findOne({
            workOrderId: workOrderId,
            
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
    // console.log(image)
    if(image !== undefined){ 
        const uploadResult = await new Promise<UploadApiResponse >((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: `${cloudinaryAsset.cleanerFolder}`,
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
    
    

    cleanerEvidenceId = await insertEvidence(workOrderId, workOrderTaskId as unknown as string, cleaner, imageUploaded, newImage, note)
    // console.log(`evidence uploaded ${cleanerEvidenceId}`)

    
    
    // get the url and public id for the work order that was just uploaded 
    const result = await CleanerEvidenceModel.findById(cleanerEvidenceId)
    return customResponse.successResponse('Evidence uploaded successfully.', result, res)
})

const deleteEvidence = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const {workOrderEvidenceId} = req.query
    const {publicId} = req.body
    // find the work order evidence id 
    const result = await CleanerEvidenceModel.findById(workOrderEvidenceId)
    if(!result){ 
        return customResponse.notFoundResponse('There is no cleaner evidence with such id ', res)
    }
    // using the publicId get the public id from the images they want to delete 
    const imageEvidence = await CleanerEvidenceModel.updateOne(
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

    const updatedEvidence = await CleanerEvidenceModel.findById(workOrderEvidenceId)
    return customResponse.successResponse('Image deleted', updatedEvidence, res)

})

// clean submit task. set isDone to true for that task_id 
const submitTask = catchAsync(async (req:AuthenticatedRequest, res: Response) => { 
    const {workOrderTaskId} = req.body
    const cleaner = req.auth.userId
    let updateCount= 0
    const session = await mongoose.startSession()
    session.startTransaction()

    const result = await Promise.all(workOrderTaskId.map(async (taskId: mongoose.Types.ObjectId) => { 
        // check if the correct id is passed 
        const existingTask = await WorkOrderTaskModel.findById(taskId).session(session)
        if(!existingTask){ 
            await session.abortTransaction()
            session.endSession()
            return customResponse.notFoundResponse('Invalid work order task passed', res)
        }
        // get the work order id of the task
        const workOrder = existingTask.workOrderId
        // get the evidence level of the work order 
        const existingWorkOrder = await WorkOrderModel.findById(workOrder).populate('evidenceLevel').session(session)
        // get the min values of the evidence for the work order 
        const workOrderEvidence = existingWorkOrder?.evidenceLevel as Partial<EvidenceLevel>
        if (workOrderEvidence && workOrderEvidence.minValue !== undefined) {
            const minValue = workOrderEvidence.minValue as number 
            // check the number of evidence uploaded by the cleaner 
            const date = getCurrentDateInLosAngelesFormatted(); // Format as YYYY-MM-DD
            const cleanerEvidence = await CleanerEvidenceModel.findOne({
                workOrderTaskId: taskId,
                cleaner: cleaner, 
                $or: [
                    { 'evidence.images.uploadedAt': { $gte: new Date(`${date}T00:00:00.000Z`), $lte: new Date(`${date}T23:59:59.999Z`) } },
                    { 'evidence.notes.uploadedAt': { $gte: new Date(`${date}T00:00:00.000Z`), $lte: new Date(`${date}T23:59:59.999Z`) } }
                ]
            }).session(session)
            if(cleanerEvidence){ 
                const imageCount = cleanerEvidence.evidence?.images?.length == undefined ? 0 : cleanerEvidence.evidence.images.length
                if(imageCount < minValue){ 
                    await session.abortTransaction()
                    session.endSession() 
                    return customResponse.badRequestResponse(`You must upload a minimum of ${minValue} image${minValue > 1 ? 's' : ''}  for ${existingWorkOrder?.name}`, res)
                }
            }else{ 
                await session.abortTransaction()
                session.endSession()
                return customResponse.badRequestResponse(`You must upload a minimum of ${minValue} image${minValue > 1 ? 's' : ''} for ${existingWorkOrder?.name}`, res)
            }
        }
        // update the task status to true 
        const update = await WorkOrderTaskModel.findByIdAndUpdate(taskId, 
            {isDone: true}, 
            {new: true}
        )
        // if(update){ 
        //     updateCount += 1
        // }
        // return updateCount
    }))
    await session.commitTransaction()
    session.endSession()
    return customResponse.successResponse('All work orders updated', {}, res)
    // if(result == workOrderTaskId.length){ 
    //     await session.commitTransaction()
    //     session.endSession()
    //     return customResponse.successResponse('All work orders updated', {}, res)
    // }else{ 
    //     await session.abortTransaction()
    //     session.endSession()
    //     return customResponse.badRequestResponse('Something went wrong while updating', res)
    // }
})
export default{ 
    helloCleanerV1, 
    getWorkOrder, 
    getAssetTask,
    uploadEvidence, 
    deleteEvidence, 
    submitTask
}