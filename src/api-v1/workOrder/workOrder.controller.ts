import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from 'express';
import customResponse from "../../helpers/response";
import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import WorkOrderModel, { WorkOrder, workOrderStatus } from "../../models/workorder";
import WorkOrderAssigneeModel, { WorkOrderAssignee } from "../../models/workOrderAssignee";
import mongoose from "mongoose";
import WorkOrderTaskModel from "../../models/workOrderTasks";
import TeamModel from "../../models/teams";
import WorkOrderScheduleModel, { WorkOrderSchedule } from "../../models/workOrderSchedule";
import { getCurrentDateInLosAngeles, getCurrentDateInLosAngelesFormatted } from "../../utils/date";

import FrequencyModel from "../../models/frequency";
import { generateScheduledDates} from "../../utils/date";
import AssetTaskType, { RoomDetailCleaningType } from "../../models/roomDetailCleaning";
import { IAssetTaskType } from "../../types/interface";
import workOrderAssetTaskModel from "../../models/workOrderAssetTask";
import RoomModel from "../../models/room";
import RoomDetailModel from "../../models/roomDetail";
import TaskTypeModel from "../../models/taskType";
import CleanerEvidenceModel from "../../models/cleanerEvidence";
import CleanerGeneralEvidenceModel from "../../models/cleanerGeneralEvidence";
import InspectorEvidenceModel from "../../models/inspectorEvidenceNew";
import InspectorGeneralEvidenceModel from "../../models/inspectorGeneralEvidence";
import UserRoles from "../../models/userRoles";
import InspectorFacilityModel from "../../models/inspectorFacilities";
import { getLoggedInUserRoleName } from "../../utils/getLoggedInUserRoleName";
import { Roles } from "../../constant/roles";
import CleanerFacilityModel from "../../models/cleanerFacilities";
import { createMessage, sendNotification } from "../../utils/notification";
import NotificationModel from "../../models/notification";

const moduleName = "[work order v1/controller]";
const Logger = createChildLogger(moduleName);

const createWorkOrder = catchAsync(async (req: AuthenticatedRequest, res:Response) => { 
    const {name, taskListId, assignToIndividual, assets, teamIds, cleaners, inspectors, cleanerAssets, inspectorAssets, frequency, cleaningValidPeriod, start_date, end_date, override, evidenceLevel } = req.body
    // check if the name of the work order already exists 
    console.log(`in the work order custom create from frontend =>`,name, taskListId, assignToIndividual, assets, teamIds, cleaners, inspectors, frequency, cleaningValidPeriod, start_date, end_date, override, evidenceLevel )
    
    Logger.info(typeof(cleaningValidPeriod))
    const convertCleaningPeriod: number = parseInt(cleaningValidPeriod) 
    const existingName = await WorkOrderModel.findOne({name: name})
    if(existingName){ 
        return customResponse.badRequestResponse('Name already exists', res)
    }

    let finalInspector:string[] = [...inspectors]
    let finalCleaner:string[] = [...cleaners]
    let cleaningPeriod  = convertCleaningPeriod ? convertCleaningPeriod : 12 //if the user does not pass the cleaning Period, it means the cleaning Period is 12hrs by default
    let cleaningFrequency = frequency ? frequency : 'oneOff' // if the user does not pass the frequency, set it to one-off
    const startDate:Date =  start_date? new Date(start_date) : new Date(getCurrentDateInLosAngeles()) //no start date? use current date
    const endDate:Date = end_date? new Date(end_date) : new Date(getCurrentDateInLosAngeles()) // no start date? use current date 
    const daysDiff: number = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const taskListIdCheck = taskListId ? taskListId : null 
    const evidenceLevelCheck = evidenceLevel ? evidenceLevel : null

    const dateString = startDate.toISOString(); // Convert the date to a string in ISO format

    // The hour is in the 11th and 12th positions (index 11 and 12)
    const hourString = dateString.substring(11, 13);
    // Extract minutes from the ISO string
    const minuteString = dateString.substring(14, 16);

    // Format minutes
    const formattedMinutes = minuteString === '00' ? minuteString : minuteString.replace(/^0/, '');
    const minuteAsNumber: number = parseInt(formattedMinutes, 10)
   
    // Remove leading zero if it's there
    const finalHour = hourString.startsWith('0') ? hourString.slice(1) : hourString;

    const hourAsNumber: number = parseInt(finalHour, 10);
    // get the frequency to calculate the scheduled dates 
    const cronExpression = await FrequencyModel.findById(cleaningFrequency)
    if(!cronExpression){ 
        return customResponse.badRequestResponse('There is no such frequency', res)
    }
    console.log(`Difference in days: ${daysDiff}`);

    const session = await mongoose.startSession();
    session.startTransaction();
    
    // create the work order 
    const savedWorkOrder = new WorkOrderModel({ 
        name: name,
        taskList: taskListIdCheck, 
        assignAssetToIndividual: assignToIndividual, 
        overridePermission: override, 
        evidenceLevel: evidenceLevelCheck
    })

    const newWorkOrder = await savedWorkOrder.save({session})

    const savedWorkOrderAssetTask = new workOrderAssetTaskModel({ 
        workOrderId: newWorkOrder._id, 
        assetTask: assets[0].assetTaskType
    })

    const newWorkOrderAssetTask = await savedWorkOrderAssetTask.save({session})

    // after creating the work order, check if the teamId is passed. If there are multiple teamIds, get the roles 
    if (teamIds && teamIds.length > 0) {
        for (const teamId of teamIds) {
            const team = await TeamModel.findById(teamId).populate('members.roleId');
            if (!team) {
                return customResponse.notFoundResponse(`There is no team with the id ${teamId}`, res);
            }

            team?.members.forEach(member => {
                if (member.roleId.role_name === "Inspector") {
                    finalInspector.push(member.userId.toString());
                } else if (member.roleId.role_name === "Cleaner") {
                    finalCleaner.push(member.userId.toString());
                }
            });
        }
    }
    // create the work order tasks for each asset
    // if(assignToIndividual){  
    //     const tasksToInsert: any[] = []
    //     // get the cleanerAssets array and for each of it, push to the taskToInsert
    //     cleanerAssets.forEach((cleaner: { assignedTasks: any[]; cleanerId: mongoose.Types.ObjectId; }) => {
    //         cleaner.assignedTasks.forEach(task => {
    //             let scheduledDates
    //             scheduledDates = generateScheduledDates(startDate, endDate, cronExpression.availableInterval as unknown as number, cronExpression.interval as unknown as number, cronExpression.excludeWeekend as unknown as boolean, cronExpression.unit as unknown as string, cronExpression.validStartHour as unknown as number, cronExpression.validStopHour as unknown as number)
    //             // Logger.info(scheduledDates)
    //             for(let i = 0; i < scheduledDates.length ; i++){
    //                 const validCleaningTime = new Date(scheduledDates[i])
    //                 validCleaningTime.setHours(validCleaningTime.getHours() + cleaningPeriod)

    //                 tasksToInsert.push({
    //                     workOrderId: newWorkOrder._id, 
    //                     assetId: task.assetId, 
    //                     assetTaskType: task.assetTaskType,
    //                     roomId: task.roomId, 
    //                     scheduledDate: scheduledDates[i],
    //                     validCleaningPeriod: validCleaningTime, 
    //                     assignedCleaner: cleaner.cleanerId,
    //                     exclude: false, 
    //                     isDone: false, 
    //                     isApproved: false
    //                 })
    //             }
    //         });
    //         finalCleaner.push(cleaner.cleanerId.toString())
    //     });
    //     // same for the inspectorAssets
    //     inspectorAssets.forEach((inspector: { assignedTasks: any[]; inspectorId: mongoose.Types.ObjectId; }) => {
    //         inspector.assignedTasks.forEach((task: { assetId: mongoose.Types.ObjectId; assetTaskType: mongoose.Types.ObjectId; roomId: mongoose.Types.ObjectId; }) => {
    //             let scheduledDates
    //             scheduledDates = generateScheduledDates(startDate, endDate, cronExpression.availableInterval as unknown as number, cronExpression.interval as unknown as number, cronExpression.excludeWeekend as unknown as boolean, cronExpression.unit as unknown as string, cronExpression.validStartHour as unknown as number, cronExpression.validStopHour as unknown as number)
                
    //             // Logger.info(scheduledDates)
    //             for(let i = 0; i < scheduledDates.length ; i++){
    //                 const validCleaningTime = new Date(scheduledDates[i])
    //                 validCleaningTime.setHours(validCleaningTime.getHours() + cleaningPeriod)

    //                 tasksToInsert.push({
    //                     workOrderId: newWorkOrder._id, 
    //                     assetId: task.assetId, 
    //                     assetTaskType: task.assetTaskType,
    //                     roomId: task.roomId, 
    //                     scheduledDate: scheduledDates[i],
    //                     validCleaningPeriod: validCleaningTime, 
    //                     assignedInspector: inspector.inspectorId,
    //                     exclude: false, 
    //                     isDone: false, 
    //                     isApproved: false
    //                 })
    //             }
    //         });
    //         finalInspector.push(inspector.inspectorId.toString())
    //     });
    //     // insert many
    //     await WorkOrderTaskModel.insertMany(tasksToInsert, {session})
    // }
    // else{
    const assetTasks: any[] = []
    assets.forEach((asset: { assetId: mongoose.Schema.Types.ObjectId; assetTaskType: mongoose.Schema.Types.ObjectId; roomId: mongoose.Schema.Types.ObjectId; exclude: Boolean; }) => {
        let scheduledDates
        scheduledDates = generateScheduledDates(startDate, endDate, cronExpression.availableInterval as unknown as number, cronExpression.interval as unknown as number, cronExpression.excludeWeekend as unknown as boolean, cronExpression.unit as unknown as string, cronExpression.validStartHour as unknown as number, cronExpression.validStopHour as unknown as number)
        
        
        for(let i = 0; i < scheduledDates.length ; i++){
            const validCleaningTime = new Date(scheduledDates[i])
            Logger.info(validCleaningTime)

            validCleaningTime.setHours(validCleaningTime.getHours() + cleaningPeriod)

            Logger.info(`valid cleaninnggg => ${validCleaningTime.getHours() + cleaningPeriod}`)
            assetTasks.push({
                workOrderId: newWorkOrder._id, 
                assetId: asset.assetId, 
                assetTaskType: asset.assetTaskType,
                roomId: asset.roomId, 
                scheduledDate: scheduledDates[i],
                validCleaningPeriod: validCleaningTime, 
                exclude: asset.exclude, 
                isDone: false, 
                isApproved: false
            })
        }}
    )
        await WorkOrderTaskModel.insertMany(assetTasks, {session})
    // }
    // create the unique cleaner
    const uniqueCleaners = Array.from(new Set(finalCleaner));
    const uniqueInspectors = Array.from(new Set(finalInspector));

    if(uniqueCleaners.length == 0 || uniqueInspectors.length == 0){ 
        await session.abortTransaction()
        session.endSession()
        return customResponse.badRequestResponse('Cannot create a work order without cleaners or inspectors',res)
    }

    // save the notification for now 
    // TODO: USe pusher 
    const rooms = assets[0].roomId
    const roomDetails = await RoomModel.findById(rooms)
    
    uniqueCleaners.forEach(async (cleanerId) => { 
        const message = createMessage(roomDetails?.roomName)
        await sendNotification(cleanerId as unknown as mongoose.Types.ObjectId, req.auth.userId, savedWorkOrder._id, message)
    })

    uniqueInspectors.forEach(async (inspectorId) => { 
        const message = createMessage(roomDetails?.roomName)
        await sendNotification(inspectorId as unknown as mongoose.Types.ObjectId, req.auth.userId, savedWorkOrder._id, message)
    })
    // after creating the work order, set the assigned people to the work order 
    const workOrderAssignee = new WorkOrderAssigneeModel({ 
        workOrderId: newWorkOrder._id, 
        team: teamIds, 
        cleaner: uniqueCleaners, //do not take duplicate 
        inspector: uniqueInspectors
    })

    await workOrderAssignee.save({session})

    const workOrderSchedule = new WorkOrderScheduleModel({ 
        workOrderId: newWorkOrder._id, 
        frequency: cleaningFrequency, 
        startDate: startDate, 
        endDate: endDate, 
        startHour: hourAsNumber, 
        startMinute: minuteAsNumber,
        cleaningValidPeriod: cleaningValidPeriod
    })

    await workOrderSchedule.save({session})

    // set the activeMss to true 
    await Promise.all(assets.map(async (asset: { assetTaskType: mongoose.Types.ObjectId; }) => { 
        await AssetTaskType.findByIdAndUpdate(asset.assetTaskType, {mssActive: true}, {session})
    }))
    await session.commitTransaction();
    session.endSession();

    return customResponse.successResponse('Work order created', {}, res);
})

const getAllWorkOrder = catchAsync(async (req:AuthenticatedRequest, res: Response) => { 
    const result = await WorkOrderModel.find()
    return customResponse.successResponse('all work orders', result, res)
})

const updateWorkOrder = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { workOrderId } = req.query;
    const { active, overridePermission, startDate, startHour, startMinute, endDate, validCleaningPeriod, teams, cleaners, inspectors, editEndDate, editValidCleaningPeriod, evidenceLevel } = req.body;
    
    // console.log(startHour, startMinute)
    let finalInspector:string[] = []
    let finalCleaner: string[] =[]
    let staffsAssigned = false 
    if(inspectors !== undefined){ 
        finalInspector = [...inspectors]
    }
    
    if(cleaners !== undefined){ 
        finalCleaner = [...cleaners]
    }
    

    // Construct the update object dynamically based on provided fields
    const updateFields: any = {};
    if (active !== undefined) {
        updateFields.active = active;
    }
    if (overridePermission !== undefined) {
        updateFields.overridePermission = overridePermission;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const workOrderDetails:any = await workOrderAssetTaskModel.findOne({workOrderId: workOrderId}).populate({
        path: 'assetTask',
        populate: [
            { 
                path: 'cleaningTypeFrequency',
                model: FrequencyModel
            },
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
        ]
    })
    const existingWorkSchedule = await WorkOrderScheduleModel.findOne({workOrderId: workOrderId})

    // get the work order and check if people have been assigned so that you can set the staffsAssigned to true 
    const existingStaffs = await WorkOrderAssigneeModel.findOne({workOrderId: workOrderId}) as Partial<WorkOrderAssignee>
    if(!existingStaffs){ 
        await session.abortTransaction()
        session.endSession()
        return customResponse.notFoundResponse('Something must have gone wrong while generating mss for the asset task type', res)
    }
    //typescript does not know that existingStaffs.cleaner and inspector are arrays so instantiate one else error
    const existingStaffCleaner = existingStaffs.cleaner || []
    const existingStaffInspector = existingStaffs.inspector || []
    if((existingStaffCleaner.length > 0) && (existingStaffInspector.length > 0)){ 
        staffsAssigned = true
    }

    if(!existingWorkSchedule){ 
        await session.abortTransaction()
        session.endSession()
        return customResponse.notFoundResponse('Something must have gone wrong while generating mss for the asset task type', res)
    }
    // console.log(workOrderDetails)
    // if(!workOrderDetails){ 
    //     session.abortTransaction()
    //     session.endSession()

        
    // }
    if(evidenceLevel){ 
        await WorkOrderModel.findByIdAndUpdate(
            {workOrderId}, 
            {evidenceLevel: evidenceLevel},
            {new: true, session}
        )
        await session.commitTransaction()
        session.endSession()
        return customResponse.successResponse('Evidence level set', {}, res)
    }
    if(startHour >= 0){ 
        console.log(startMinute)
        await WorkOrderScheduleModel.findOneAndUpdate(
            {workOrderId}, 
            {startHour: startHour, startMinute: startMinute}, 
            {new: true, session}
        )
        await session.commitTransaction()
        session.endSession()
        return customResponse.successResponse('Start Hour for work order set', {}, res)
    }
    if(startDate){
        const existingStartHour = await WorkOrderScheduleModel.findOne({workOrderId: workOrderId})
        if(!existingStartHour){ 
            await session.abortTransaction()
            session.endSession()
            return customResponse.notFoundResponse('Please set the start hour first', res)
        }
        const formatStartDate = new Date(startDate).setUTCHours(existingStartHour.startHour as number, existingStartHour.startMinute as number)
       await WorkOrderScheduleModel.findOneAndUpdate(
            {workOrderId},
            {startDate: formatStartDate},
            {new: true, session}
        )
        await session.commitTransaction()
        session.endSession()
        return customResponse.successResponse('start date updated', {}, res)
        
    }
    let generateTask = false
    if(endDate){ 
        await WorkOrderScheduleModel.findOneAndUpdate(
            {workOrderId},
            {endDate: endDate}, 
            {new:true, session}
        )
        if (!editEndDate) {
            await session.commitTransaction();
            session.endSession();
            return customResponse.successResponse('End date set', {}, res);
        }
        
    }
    if(validCleaningPeriod){ 
        await WorkOrderScheduleModel.findOneAndUpdate(
            {workOrderId}, 
            {cleaningValidPeriod: validCleaningPeriod},
            {new: true, session}
        )
        if(!editValidCleaningPeriod){ 
            await session.commitTransaction()
            session.endSession()
            return customResponse.successResponse('Valid cleaning period updated', {}, res)    
        }
       
    }

    // handle the teams, cleaner and supervisor
    if (teams && teams.length > 0) {
        for (const teamId of teams) {
            const team = await TeamModel.findById(teamId).populate('members.roleId');
            if (!team) {
                return customResponse.notFoundResponse(`There is no team with the id ${teamId}`, res);
            }

            team?.members.forEach(member => {
                if (member.roleId.role_name === "Inspector") {
                    finalInspector.push(member.userId.toString());
                } else if (member.roleId.role_name === "Cleaner") {
                    finalCleaner.push(member.userId.toString());
                }
            });
        }
    }
    // create the unique cleaner
    const uniqueCleaners = Array.from(new Set(finalCleaner));
    const uniqueInspectors = Array.from(new Set(finalInspector));

    if(uniqueCleaners.length > 0 || uniqueInspectors.length > 0){ 
        const previousAssignees = await WorkOrderAssigneeModel.findOne({workOrderId: workOrderId})
        const previousCleaners = previousAssignees?.cleaner || []
        const previousInspectors = previousAssignees?.inspector || []

        // now remove the notification regarding the work order for the previous persons if any
         // 2. Remove notifications for previous cleaners and inspectors
        if (previousCleaners.length > 0 && uniqueCleaners.length > 0) {
            await NotificationModel.updateMany(
                { receiver: { $in: previousCleaners }, 'messages.workOrderId': workOrderId },
                { $pull: { messages: { workOrderId: workOrderId } } }, 
                {session}
            );
        }

        if (previousInspectors.length > 0 && uniqueInspectors.length > 0) {
            await NotificationModel.updateMany(
                { receiver: { $in: previousInspectors }, 'messages.workOrderId': workOrderId },
                { $pull: { messages: { workOrderId: workOrderId } } },
                {session}
            );
        }

        // then assign the work order to the new people from uniqueCleaners and uniqueInspectors
        // get the room Name so you can create the message. The issue now is that there is no direct way to get the roomName from the workOrder so
        // I have to populate. If I want to use workOrderAssetTaskModel,
        const workOrderAssetTasks:any = await workOrderAssetTaskModel.findOne({ workOrderId: workOrderId }).populate({
            path: 'assetTask',
            populate: [
                {
                    path: 'roomId',
                    model: RoomModel
                }
            ]
        })
        console.log(workOrderAssetTasks)
        const roomName = workOrderAssetTasks.length > 0 ? workOrderAssetTasks?.assetTask?.roomId?.roomName : 'Unknown Room'; 
        const message = createMessage(roomName)

        if (previousCleaners.length > 0 && uniqueCleaners.length > 0) {
            uniqueCleaners.forEach(async (cleanerId) => { 
                await sendNotification(cleanerId as unknown as mongoose.Types.ObjectId, req.auth.userId, workOrderId as unknown as mongoose.Types.ObjectId, message)
            })
        }

        if (previousInspectors.length > 0 && uniqueInspectors.length > 0) {
            uniqueInspectors.forEach(async (inspectorId) => { 
                await sendNotification(inspectorId as unknown as mongoose.Types.ObjectId, req.auth.userId, workOrderId as unknown as mongoose.Types.ObjectId, message)
            })
        }
    }

    let updateAssigneeFields:any = {}
    let clearFields:any = {};

    // If new teams are provided, clear both 'team' and 'cleaner' fields
    if(teams && teams.length > 0){
        clearFields.team = [];
        clearFields.cleaner = [];
        updateAssigneeFields.team = {$each: teams}
    }
    // If uniqueCleaners are provided, clear the 'team' and 'cleaner' fields
    if (uniqueCleaners && uniqueCleaners.length > 0) {
        clearFields.team = [];
        clearFields.cleaner = [];
        updateAssigneeFields.cleaner = { $each: uniqueCleaners };

    }
    
    // If uniqueInspectors are provided, clear the 'inspector' field
    if (uniqueInspectors && uniqueInspectors.length > 0) {
        clearFields.inspector = [];
        updateAssigneeFields.inspector = { $each: uniqueInspectors };
    }
    
    // bear in mind that if there was a team previously and only one cleaner is passed, all the teams and previous cleaners should be removed 
    // the supervisor stay but if they change the supervisor, all existing supervisor leave 
    
    console.log(uniqueCleaners, uniqueInspectors)
    // First update: clear specified fields
    if (Object.keys(clearFields).length > 0) {
        await WorkOrderAssigneeModel.updateOne(
            { workOrderId: workOrderId },
            { $set: clearFields },
            { session }
        );
    }

    let staffAssigned = null
    if (Object.keys(updateAssigneeFields).length > 0) {
        staffAssigned = await WorkOrderAssigneeModel.findOneAndUpdate(
            { workOrderId: workOrderId },
            { $addToSet: updateAssigneeFields },
            { new: true, session }
        );
    }
    console.log(`staff assigned ${staffAssigned}` )

    if(validCleaningPeriod && editValidCleaningPeriod && staffAssigned == null){ 
        await WorkOrderScheduleModel.findOneAndUpdate(
            {workOrderId}, 
            {cleaningValidPeriod: validCleaningPeriod},
            {new: true, session}
        )

        await session.commitTransaction()
        session.endSession()
        return customResponse.successResponse('Updated the cleaning duration', {}, res)
    }

    if(endDate && editEndDate && staffAssigned == null){ 
        await WorkOrderScheduleModel.findOneAndUpdate(
            {workOrderId},
            {endDate: endDate}, 
            {new:true, session}
        )

        await session.commitTransaction()
        session.endSession()
        return customResponse.successResponse('Updated the End Date', {}, res)
    }

    if(!staffAssigned && Object.keys(updateAssigneeFields).length > 0){ 
        await session.abortTransaction()
        session.endSession()
        return customResponse.notFoundResponse('Failed to assign staffs', res)
    }
    if(staffAssigned){ 
        staffsAssigned = true
    }

    //if staffs have been assigned to the work order, generate task or update cleaning valid period 
    if(staffsAssigned){ 
        let generatedTasks = false
        if(editValidCleaningPeriod){ 
            await WorkOrderScheduleModel.findOneAndUpdate(
                {workOrderId}, 
                {cleaningValidPeriod: validCleaningPeriod},
                {new: true, session}
            )
            //update the remaining tasks associated with the work order 
            const losAngelesDate = getCurrentDateInLosAngeles()
            const losAngelesDateFormatted = losAngelesDate.setHours(0, 0, 0, 0)

            const tasks = await WorkOrderTaskModel.find({
                workOrderId: workOrderId, 
                validCleaningPeriod: {$gte: losAngelesDateFormatted}
            }).session(session)

            if (!tasks || tasks.length === 0) {
                await session.abortTransaction();
                session.endSession();
                return customResponse.notFoundResponse('No tasks found for the given work order and date criteria', res);
            }

            const updatedTasks = tasks.map(task => {
                const newValidCleaningPeriod = task.validCleaningPeriod as unknown as Date;
                const scheduledHour = task.scheduledDate as unknown as Date
                const scheduledHourTime = scheduledHour.getHours()
                newValidCleaningPeriod.setHours(validCleaningPeriod+scheduledHourTime);
    
                return {
                    ...task.toObject(),
                    validCleaningPeriod: newValidCleaningPeriod
                };
            });

            // bulk update 
            const bulkOperations = updatedTasks.map(task => ({
                updateOne: {
                    filter: { _id: task._id },
                    update: { validCleaningPeriod: task.validCleaningPeriod }
                }
            }));
    
            await WorkOrderTaskModel.bulkWrite(bulkOperations, { session });
    
            await session.commitTransaction();
            session.endSession();
            return customResponse.successResponse('Valid cleaning period updated and tasks updated', {}, res)
        }
        const verifyTaskCreationCheck:WorkOrderSchedule | null = await WorkOrderScheduleModel.findOne({workOrderId})
        if(verifyTaskCreationCheck?.startDate !== null && (verifyTaskCreationCheck?.endDate !== null) && (verifyTaskCreationCheck?.cleaningValidPeriod !== 0)){ 
            // generate task for the work order 
            console.log('let us generate teask ')
            const scheduledStartDate = verifyTaskCreationCheck?.startDate as unknown as Date
            const scheduledEndDate = verifyTaskCreationCheck?.endDate as unknown as Date
            const scheduledValidCleaning = verifyTaskCreationCheck?.cleaningValidPeriod as unknown as number
            const availableInterval = workOrderDetails.assetTask.cleaningTypeFrequency?.availableInterval
            const interval = workOrderDetails.assetTask.cleaningTypeFrequency?.interval
            const excludeWeekend = workOrderDetails.assetTask.cleaningTypeFrequency?.excludeWeekend
            const unit = workOrderDetails.assetTask.cleaningTypeFrequency?.unit
            const validStartHour = workOrderDetails.assetTask.cleaningTypeFrequency?.validStartHour
            const validStopHour = workOrderDetails.assetTask.cleaningTypeFrequency?.validStopHour
            let scheduledDates:string[] | string = []
    
            // check if the work order already has work order tasks 
            const workOrderTaskCheck = await WorkOrderTaskModel.findOne({workOrderId: workOrderId})
    
            if(editEndDate){ 
                const lastExistingTask = await WorkOrderTaskModel.findOne({workOrderId: workOrderId}).sort({scheduledDate: -1})
                if(lastExistingTask){ 
                    generateTask = true
                    const lastTaskDate = lastExistingTask.scheduledDate as unknown as Date
                    scheduledDates = generateScheduledDates(lastTaskDate, endDate, availableInterval, interval, excludeWeekend, unit, validStartHour, validStopHour)
                }
            }
            if(!workOrderTaskCheck){ 
                generateTask = true
                scheduledDates = generateScheduledDates(scheduledStartDate, scheduledEndDate, availableInterval,interval, excludeWeekend, unit, validStartHour, validStopHour)
            }
            if(generateTask){ 
                generatedTasks = true
                console.log(editEndDate? 'work order end date extended' : 'no work order. create')
                const tasks: any[] = []
                for(let i = 0; i< scheduledDates.length; i++){ 
                    const validCleaningTime = new Date(scheduledDates[i])
                    validCleaningTime.setHours(validCleaningTime.getHours() + scheduledValidCleaning)
                    
                    tasks.push({
                        workOrderId: workOrderId, 
                        assetId: workOrderDetails.assetTask.assetId?._id, 
                        assetTaskType: workOrderDetails.assetTask._id,
                        roomId: workOrderDetails.assetTask.roomId?._id, 
                        scheduledDate: scheduledDates[i],
                        validCleaningPeriod: validCleaningTime, 
                        exclude: false, 
                        isDone: false, 
                        isApproved: false
                    })
                }
                await WorkOrderTaskModel.insertMany(tasks, {session})
            }
            
            if(generatedTasks){ 
                await session.commitTransaction();
                session.endSession();
                return customResponse.successResponse('Tasks generated', {}, res)
            }else{ 
                await session.commitTransaction()
                session.endSession()
                return customResponse.successResponse('Staff assigned', {}, res)
            }
           
        }else{ 
            await session.commitTransaction()
            session.endSession()
            return customResponse.successResponse('Staff assigned', {}, res)
        }
        
        

        
    }
   


    if((active !== undefined) || (overridePermission !== undefined)){
        const workOrderUpdate = await WorkOrderModel.findByIdAndUpdate(
            workOrderId,
            updateFields,
            { new: true, session }
        );
        if (!workOrderUpdate) {
            await session.abortTransaction();
            session.endSession();
            return customResponse.badRequestResponse('Work order not found', res);
        }
    
        const workOrderScheduleUpdate = await WorkOrderScheduleModel.findOneAndUpdate(
            { workOrderId: workOrderId },
            updateFields,
            { new: true, session }
        );
        if (!workOrderScheduleUpdate) {
            await session.abortTransaction();
            session.endSession();
            return customResponse.badRequestResponse('Work order schedule not found', res);
        }
    
        const workOrderTasksUpdate = await WorkOrderTaskModel.updateMany(
            { workOrderId: workOrderId },
            updateFields,
            { session }
        );
        if (!workOrderTasksUpdate) {
            await session.abortTransaction();
            session.endSession();
            return customResponse.badRequestResponse('No work order tasks found', res);
        }
    
    }
    
    await session.commitTransaction();
    session.endSession();

    
   
});

const generateWorkOrder = catchAsync(async (req:AuthenticatedRequest, res: Response) => { 
    // get all the active work schedules 
    const session = await mongoose.startSession()
    session.startTransaction();

    const result = await AssetTaskType.find().populate('cleaningType cleaningTypeFrequency roomId assetId').session(session)
    const filteredResult = result.filter(schedules => schedules.active)

    // console.log(`the length og the result is ${filteredResult.length}`)
    

    // for each of them, create a work order 
    await Promise.all(filteredResult.map(async (assetTask: any) => { 
        
        if(!assetTask.mssActive){
            // activate mss for that asset 
            await AssetTaskType.findByIdAndUpdate(assetTask._id, {mssActive: true}, {new: true, session})

            const newWorkOrder = new WorkOrderModel({ 
                name: `${assetTask.cleaningType.name} for ${assetTask.assetId.name} work order`, 
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

    // const createdAssetTask = await workOrderAssetTaskModel.find()
    // .populate('workOrderId')
    // .populate({
    //     path: 'assetTask',
    //     populate: [
    //         {
    //             path: 'roomId',
    //             model: RoomModel
    //         },
    //         {
    //             path: 'assetId',
    //             model: RoomDetailModel
    //         }, 
    //         { 
    //             path: 'cleaningType', 
    //             model: TaskTypeModel
    //         }, 
    //         { 
    //             path: 'cleaningTypeFrequency',
    //             model: FrequencyModel
    //         }
    //     ]

        
    // })

    return customResponse.successResponse('work order generated', {}, res)
})

const createCustomWorkOrder = catchAsync(async (req: AuthenticatedRequest, res:Response) => { 
    // they select a room. based on the room, they selct an asset and make request to http://localhost:3000/api/v1/assets/asset-details?assetId=667b9c459b602b5c67730ce5 the _id in the response is the assetTaskId
    const {assetTaskId} = req.body

    const session = await mongoose.startSession()
    session.startTransaction();

    const existingAssetTask:any = await AssetTaskType.findById(assetTaskId).populate('cleaningType cleaningTypeFrequency roomId assetId')
    if(!existingAssetTask){ 
        await session.abortTransaction()
        session.endSession()
        return customResponse.notFoundResponse('There is no such asset task id', res)
    }
    // if found, create the work order, work schedule, work assignee and then push to the workOrderAssetTaskModel
    // check if there is a work order with that name. If yes count and add plus one 
    let workOrderName = ''
    let existingWorkOrderCount = 0
    workOrderName =  `${existingAssetTask.cleaningType.name} for ${existingAssetTask.assetId.name} work order`

    const existingWorkOrderName = await WorkOrderModel.findOne({name: workOrderName}).countDocuments()
    if(existingWorkOrderName){ 
        existingWorkOrderCount += existingWorkOrderName
    }
    const newWorkOrder = new WorkOrderModel({ 
        name: `${existingAssetTask.cleaningType.name} for ${existingAssetTask.assetId.name} work order${existingWorkOrderCount > 0 ? `${existingWorkOrderCount}` : '' }`, 
    })
   
    const savedWorkOrder = await newWorkOrder.save({session})
    
            
    //save work order asset
    const newWorkOrderAsset = new workOrderAssetTaskModel({ 
        workOrderId: savedWorkOrder._id, 
        assetTask: existingAssetTask._id
    })
    

    await newWorkOrderAsset.save({session})
    

    //save work order schedule
    const newWorkOrderSchedule = new WorkOrderScheduleModel({ 
        workOrderId: savedWorkOrder._id,
        frequency: existingAssetTask.cleaningFrequency?._id ? existingAssetTask.cleaningFrequency._id : null
    })
    
    await newWorkOrderSchedule.save({session})
    

    // generate the work order assignee too 
    const newWorkOrderAssignee = new WorkOrderAssigneeModel({ 
        workOrderId: savedWorkOrder._id
    })
    

    await newWorkOrderAssignee.save({session})

    await session.commitTransaction()
    session.endSession()
    
    return customResponse.successResponse('Work order created. Instantiate in the manage mss', {}, res)
})
const mssTable = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const mssData = await workOrderAssetTaskModel.find()
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
    const result = await Promise.all(mssData.map(async (data: any) => { 
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

})

const resetMss = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Get all assetTaskType
        const assetTaskTypes = await AssetTaskType.find().session(session); // Ensure session is used here

        // Update all assetTaskTypes
        await Promise.all(assetTaskTypes.map(async (assets) => {
            await AssetTaskType.findByIdAndUpdate(
                assets._id,
                { mssActive: false },
                { new: true, session }
            ).session(session)
        }));

        // Delete all related collections
        await WorkOrderModel.deleteMany().session(session);
        await WorkOrderScheduleModel.deleteMany().session(session);
        await WorkOrderAssigneeModel.deleteMany().session(session);
        await WorkOrderTaskModel.deleteMany().session(session);
        await workOrderAssetTaskModel.deleteMany().session(session);
        await CleanerEvidenceModel.deleteMany().session(session);
        await CleanerGeneralEvidenceModel.deleteMany().session(session);
        await InspectorEvidenceModel.deleteMany().session(session);
        await InspectorGeneralEvidenceModel.deleteMany().session(session);

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return customResponse.successResponse('Mss reset', {}, res);
    } catch (error:any) {
        // Abort transaction and end session in case of error
        await session.abortTransaction();
        session.endSession();
        console.error('Transaction error:', error); // Log the error for debugging

        return customResponse.serverErrorResponse('Failed to reset Mss', res, error);
    }
});

const availableTeam = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    // get all the team
    const {facilityId} = req.query
    let teams
    if(facilityId){ 
        teams = await TeamModel.find({facilityId: facilityId}).select('teamName')
    }else{ 
        teams = await TeamModel.find().select('teamName ')
    }
    console.log('heyy')
   
    if(!teams){ 
        return customResponse.createResponse('No team in the database', [], res)
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
    const {roomId, startHour} = req.query
    if(!roomId || !startHour){ 
        return customResponse.badRequestResponse('The roomId and startHour is required',res)
    }
    const roomIdCheck = await RoomModel.findById(roomId)
    if(!roomIdCheck){ 
        return customResponse.notFoundResponse('There is no room with such id', res)
    }
    const availableTeams = teamAssignment.map(({ team, assignments }) => {
        const isAvailable = !assignments.some(assignment => assignment.startHour?.toString() == startHour as string);
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
    const roleName = getLoggedInUserRoleName(req)

    if(roleName == Roles.MANAGER && !facilityId){ 
        return customResponse.successResponse('Manager must pass a facility Id', [], res)
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
    let inspectorAssignment = await Promise.all(activeInspectors.map(async (inspectors) => { 
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

    // Step 3: Filter based on facilityId (if provided)
        if (facilityId) {
            // Fetch inspectors assigned to the facility
            const facility = await InspectorFacilityModel.findOne({ facilityId }).populate('assignedInspectors').exec();
            if (facility) {
                const facilityInspectorIds = facility.assignedInspectors.map(inspector => inspector._id.toString());
                
                // Filter active inspectors based on facility assignment
                inspectorAssignment = inspectorAssignment.filter(({ inspectors }) =>
                    facilityInspectorIds.includes(inspectors.user_id._id.toString())
                );
            } else {
                return customResponse.successResponse('No facility found with the provided ID',[], res);
            }
        }

    // Filter based on availability
    const {roomId, startHour} = req.query
    if(!roomId || !startHour){ 
        return customResponse.badRequestResponse('The roomId and startHour is required',res)
    }
    const roomIdCheck = await RoomModel.findById(roomId)
    if(!roomIdCheck){ 
        return customResponse.notFoundResponse('There is no room with such id', res)
    }
    const availableInspectors = inspectorAssignment.map(({ inspectors, assignments }) => {
        const isAvailable = !assignments.some(assignment => assignment.startHour?.toString() == startHour as string);
        return {
          ...inspectors.toObject(), // Convert Mongoose document to plain object if needed
          isAvailable
        };
      });
    return customResponse.successResponse('Available Inspectors', availableInspectors, res)
})

const availableCleaner = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    // get all the inspectors who have not been fired
    const {facilityId} = req.query
    const roleName = getLoggedInUserRoleName(req)

    if(roleName == Roles.MANAGER && !facilityId){ 
        return customResponse.successResponse('Manager must pass a facility Id', [], res)
    }
    const result = await UserRoles.find({role_name: Roles.CLEANER}).populate({
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
    let inspectorAssignment = await Promise.all(activeInspectors.map(async (inspectors) => { 
        // fetch work order the inspector has been assigned to 
        const workOrders = await WorkOrderAssigneeModel.find({cleaner: {$in: inspectors.user_id._id}})

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

    // Step 3: Filter based on facilityId (if provided)
        if (facilityId) {
            // Fetch inspectors assigned to the facility
            const facility = await CleanerFacilityModel.findOne({ facilityId }).populate('assignedCleaners').exec();
            if (facility) {
                const facilityInspectorIds = facility.assignedCleaners.map(inspector => inspector._id.toString());
                
                // Filter active inspectors based on facility assignment
                inspectorAssignment = inspectorAssignment.filter(({ inspectors }) =>
                    facilityInspectorIds.includes(inspectors.user_id._id.toString())
                );
            } else {
                return customResponse.successResponse('No facility found with the provided ID',[], res);
            }
        }

    // Filter based on availability
    const {roomId, startHour} = req.query
    if(!roomId || !startHour){ 
        return customResponse.badRequestResponse('The roomId and startHour is required',res)
    }
    const roomIdCheck = await RoomModel.findById(roomId)
    if(!roomIdCheck){ 
        return customResponse.notFoundResponse('There is no room with such id', res)
    }
    const availableInspectors = inspectorAssignment.map(({ inspectors, assignments }) => {
        const isAvailable = !assignments.some(assignment => assignment.roomId?.toString() == roomId as string && assignment.startHour?.toString() == startHour as string);
        return {
          ...inspectors.toObject(), // Convert Mongoose document to plain object if needed
          isAvailable
        };
      });
    return customResponse.successResponse('Available Cleaners', availableInspectors, res)
})

const workOrderTaskTime = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const userId = req.auth.userId
    const {roomId} = req.query
    const {workOrderIds} = req.body
})
export default { 
    createWorkOrder,
    getAllWorkOrder,
    updateWorkOrder,
    generateWorkOrder,
    mssTable,
    resetMss, 
    createCustomWorkOrder, 
    availableTeam, 
    availableInspector,
    availableCleaner
}

