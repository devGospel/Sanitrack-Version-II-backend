import mongoose, { FilterQuery } from "mongoose";
import WorkOrderModel from "../models/workorder";
import WorkOrderAssigneeModel from "../models/workOrderAssignee";
import WorkOrderScheduleModel from "../models/workOrderSchedule";
import WorkOrderTaskModel, { WorkOrderTask } from "../models/workOrderTasks";
import { getCurrentDateInLosAngeles, getCurrentDateInLosAngelesFormatted } from "./date";
import RoomModel from "../models/room";
import RoomDetailModel from "../models/roomDetail";
import TaskTypeModel from "../models/taskType";
import FrequencyModel from "../models/frequency";

export const getFilteredMss = async (filterType:string, assetTaskTypeId: mongoose.Types.ObjectId) => { 
    const currentTime = getCurrentDateInLosAngeles()

    const currentDateFormatted = getCurrentDateInLosAngelesFormatted()
    let query: FilterQuery<WorkOrderTask> = { assetTaskType: assetTaskTypeId };
    switch (filterType) {
        case 'pastDue':
            query = {
                ...query,
                $or: [
                    // Case 1: lastCleaned is null and currentTime is past the validCleaningPeriod
                    {
                        lastCleaned: { $eq: null },
                        validCleaningPeriod: { $lt: currentTime }
                    },
                    // Case 2: lastCleaned is not null, either isDone or isApproved is false, and currentTime is past validCleaningPeriod
                    {
                        lastCleaned: { $ne: null },
                        $or: [
                            { isDone: false },
                            { isApproved: false }
                        ],
                        validCleaningPeriod: { $lt: currentTime }
                    }
                ],
                // Ensure we only get tasks for the date 2024-08-21
                validCleaningPeriod: {
                    $gte: new Date(`${currentDateFormatted}T00:00:00.000Z`),
                    $lte: new Date(`${currentDateFormatted}T23:59:59.999Z`)
                }
            };
            break;
        case 'done':
            query = {
                ...query,
                isDone: true,
                isApproved: true,
                scheduledDate: {
                    $gte: new Date(`${currentDateFormatted}T00:00:00.000Z`),
                    $lte: new Date(`${currentDateFormatted}T23:59:59.999Z`)
                }
            };
            break;
        case 'ongoing':
            query = {
                ...query,
                isDone: true,
                isApproved: false,
                scheduledDate: {
                    $gte: new Date(`${currentDateFormatted}T00:00:00.000Z`),
                    $lte: new Date(`${currentDateFormatted}T23:59:59.999Z`)
                }
            };
            break;
        case 'all':
        query = {
            ...query,
            scheduledDate: {
                $gte: new Date(`${currentDateFormatted}T00:00:00.000Z`),
                $lte: new Date(`${currentDateFormatted}T23:59:59.999Z`)
            }
        };
        break;
        default:
            throw new Error('Invalid filter type');
    }
    return await WorkOrderTaskModel.findOne(query).populate({
        path: 'assetTaskType',
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
    }).populate('workOrderId').sort({ scheduledDate: -1 });
}