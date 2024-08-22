import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/security";
import customResponse from "../../../helpers/response";
import { createChildLogger } from "../../../utils/childLogger";
import catchAsync from "../../../utils/catchAsync";
import { getLoggedInUserRoleName } from "../../../utils/getLoggedInUserRoleName";
import RoomDetailModel from "../../../models/roomDetail";
import WorkOrderTaskModel from "../../../models/workOrderTasks";
import WorkOrderAssigneeModel from "../../../models/workOrderAssignee";
import { formatDateYYYYMMDD, getCurrentDateInLosAngeles, getCurrentDateInLosAngelesFormatted, getNextDateInLosAngelesFormatted, getPreviousDateInLosAngelesFormatted } from "../../../utils/date";
import AssetTaskType from "../../../models/roomDetailCleaning";
import { updatedIsOverDue } from "../../../utils/passDue";
import { getAllAssetsForManager } from "../../../services/managerAsset";
import { Roles } from "../../../constant/roles";
import { getAssetsForInspector } from "../../../services/inspectorCheck";
import InspectorEvidence from "../../../models/inspectorEvidence";
import InspectorEvidenceModel from "../../../models/inspectorEvidenceNew";
import RoomModel from "../../../models/room";
import TaskTypeModel from "../../../models/taskType";
import FrequencyModel from "../../../models/frequency";
import { getFilteredMss } from "../../../utils/filterMss";

const moduleName = '[mss dashboard V1/controller]'
const Logger = createChildLogger(moduleName)

const getMssTable = catchAsync(async(req:AuthenticatedRequest, res: Response) => {
    // get all the items in the system 
    const allAssets = await RoomDetailModel.find().populate('roomId')
    const currentDate = getCurrentDateInLosAngelesFormatted()
    const currentDateTime = getCurrentDateInLosAngeles()

    console.log(currentDateTime)
    // for each of the items, get their most recent task 
    const result = await Promise.all(allAssets.map(async (asset) => { 
        const mostRecentTask = await WorkOrderTaskModel.findOne({assetId: asset._id, scheduledDate: currentDate}).populate(
            {
                path: 'workOrderId', 
                select: 'name'
            }
        ).populate({
            path: 'inspectorEvidence', 
            
        }).sort({workOrderId: -1})
        const assignedStaff = await WorkOrderAssigneeModel.findOne({workOrderId: mostRecentTask?.workOrderId}).populate({
            path: 'cleaner', 
            select: 'username email phone_number'
        }).populate({ 
            path: 'inspector', 
            select: 'username email phone_number'
        })
        const pastDue = currentDateTime > ( mostRecentTask?.scheduledDate as unknown as Date)? true : false
        return{
            asset, 
            mostRecentTask, 
            assignedStaff, 
            pastDue
        }
    }))
    return customResponse.successResponse('hello', result, res)

})

// Mss table by asset
const currentMss = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const { date } = req.query;
    let currentDate: Date | null | string = null;
    let today
    let query: any = {};

    // Parse the date query parameter
   if (date === 'today') {
         currentDate = getCurrentDateInLosAngelesFormatted()
    } else if (date === 'tomorrow') {
        currentDate = getNextDateInLosAngelesFormatted()
        // console.log(currentDate)
    } else if (date === 'yesterday') {  
        currentDate = getPreviousDateInLosAngelesFormatted();
    } else if (date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if(!dateRegex.test(date as string)){
            return customResponse.badRequestResponse('Dates must be in YYYY-MM-DD format', res);
        }
        currentDate = date as string
    } else {
        currentDate = getCurrentDateInLosAngelesFormatted(); // Default to today if no date is 
    }

 
    console.log(currentDate)
    
    // Step 1: Find all AssetTaskType where mssActive is true
    const assetTaskTypes = await AssetTaskType.find({ mssActive: true }).populate('roomId assetId cleaningType cleaningTypeFrequency');

    // Step 2: Extract the IDs of those AssetTaskType documents
    const assetTaskTypeIds = assetTaskTypes.map(assetTask => assetTask._id);

    // console.log(`Current date: ${currentDate}`);
    // console.log(assetTaskTypeIds);

    // const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    // const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

    // Step 3: For each assetTaskType ID, query the workOrderTask documents
    const results = await Promise.all(assetTaskTypeIds.map(async (id) => {
        const assetTaskType = assetTaskTypes.find(task => task._id.equals(id));

        let pastWorkOrderTasks;
        let nextScheduledTask;
        let mostRecentTask = null;
        let lastCleaned = null;
        let assignee = null
        let inspectorImages: ({ url: String; uploadedAt?: Date; }[] | undefined)[] = [];
        let inspectorNotes: ({ url: String; uploadedAt?: Date; }[] | undefined)[] = []

        if (currentDate) {
            // Get tasks where the scheduled date is less than or equal to the current date
            pastWorkOrderTasks = await WorkOrderTaskModel.findOne({
                assetTaskType: id,
                $expr: {
                    $and: [
                        { $lte: [{ $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" } }, currentDate] }
                    ]
                }
            }).sort({ scheduledDate: -1 }); // Sort by scheduledDate descending

            if (!pastWorkOrderTasks) {
                pastWorkOrderTasks = await WorkOrderTaskModel.findOne({
                    assetTaskType: id,
                    scheduledDate: currentDate
                });
            }
           
            assignee = await WorkOrderAssigneeModel.findOne({workOrderId: pastWorkOrderTasks?.workOrderId}).populate('team cleaner inspector')
            // console.log(`Past work order: ${pastWorkOrderTasks}`);
            mostRecentTask = pastWorkOrderTasks;
            lastCleaned = mostRecentTask ? mostRecentTask.lastCleaned : 'N/A';

            if(id.toString() == "66b77f5b3516b471e1154bbd"){
                console.log(pastWorkOrderTasks)
                // console.log(updatedIsOverDue(mostRecentTask?.validCleaningPeriod, mostRecentTask?.lastCleaned as unknown as Date))
            }

            // Get tasks where the scheduled date is greater than the current date
            nextScheduledTask = await WorkOrderTaskModel.findOne({
                assetTaskType: id,
                $expr: {
                    $and: [
                        { $gt: [{ $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" } }, currentDate] }
                    ]
                }
            }).sort({ scheduledDate: 1 }); // Sort by scheduledDate ascending

            // get the inspector evidence and note for the work order if any 
            const evidence = await InspectorEvidenceModel.find({workOrderTaskId: mostRecentTask?._id, $or: [
                { 'evidence.images.uploadedAt': { $gte: new Date(`${currentDate}T00:00:00.000Z`), $lte: new Date(`${currentDate}T23:59:59.999Z`) } },
                { 'evidence.notes.uploadedAt': { $gte: new Date(`${currentDate}T00:00:00.000Z`), $lte: new Date(`${currentDate}T23:59:59.999Z`) } }
            ]})

            if(evidence.length > 0){ 
                inspectorImages = evidence.map(evidences => evidences.evidence?.images) || []
                inspectorNotes = evidence.map(evidences => evidences.evidence?.images) || []
            }
            // if(id.toString() == '667b9c469b602b5c67730ce9'){
            //     console.log(nextScheduledTask)
            // }
      
            // testing purposes due to lack of data 
            // if(date == 'today'){ 
            //     nextScheduledTask = futureWorkOrderTasks[1];
            // }else if(date == 'yesterday'){ 
            //     nextScheduledTask = futureWorkOrderTasks[1] ? futureWorkOrderTasks[1] : null
            // }else if(date == 'tomorrow'){ 
            //     nextScheduledTask = futureWorkOrderTasks[0] ? futureWorkOrderTasks[0] : null
            // }else{ 
            //     nextScheduledTask = futureWorkOrderTasks[1];
            // }
            
        }
        return {
            assetTaskType,
            workOrderDetails: mostRecentTask ? mostRecentTask : [],
            lastCleaned: lastCleaned,
            pastDue: mostRecentTask ? updatedIsOverDue(mostRecentTask.validCleaningPeriod, mostRecentTask.lastCleaned as unknown as Date, mostRecentTask.isDone, mostRecentTask.isApproved) : 'N/A',
            nextCleaned: nextScheduledTask ? nextScheduledTask.scheduledDate : 'N/A',
            team: assignee ? assignee.team : 'N/A',
            cleaner: assignee ? assignee.cleaner : 'N/A',
            supervisor: assignee ? assignee.inspector : 'N/A', 
            inspectorImages: inspectorImages, 
            inspectorNotes: inspectorNotes
        };
    }));

    return customResponse.successResponse('mss by asset fetched', results, res)
})

// monthly missed cleanings 
const monthlyMissedCleaning = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const currentDate = getCurrentDateInLosAngeles()
    const endOfYesterday = new Date(currentDate);
    endOfYesterday.setDate(currentDate.getDate() - 1);

    const result = await WorkOrderTaskModel.aggregate([
        {
            $match: {
                $and: [
                    { scheduledDate: { $lte: endOfYesterday } }, // Up to yesterday
                    { isDone: false },
                    { isApproved: false },
                    { active: true }
                ]
            }
        },
        {
            $project: {
                year: { $year: "$scheduledDate" },
                month: { $month: "$scheduledDate" }
            }
        },
        {
            $group: {
                _id: { year: "$year", month: "$month" },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.year": -1, "_id.month": -1 }  // Sort by year and month in descending order
        }
    ]).exec();

    return customResponse.successResponse('monthly missed cleanings', result, res)
})

// top missed items 
const topMissedMonthlyCleaning = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const currentDate = getCurrentDateInLosAngeles()
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    const result = await WorkOrderTaskModel.aggregate([
        {
            $match: {
                scheduledDate: { $lte: yesterday }, // Up to yesterday
                isDone: false,
                isApproved: false,
                active: true
            }
        },
        {
            $group: {
                _id: "$assetId",  // Group by the identifier 
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }  // Sort by the count of missed cleanings in descending order
        },
        {
            $limit: 5  // Get the top 5 items
        },
        {
            $lookup: {
                from: "roomdetails", // Name of the collection for RoomDetailModel
                localField: "_id",
                foreignField: "_id",
                as: "assetDetails"
            }
        },
        {
            $unwind: "$assetDetails"
        },
        {
            $project: {
                assetId: "$_id",
                count: 1,
                assetName: "$assetDetails.name"  // Project the asset name field
            }
        }
    ]).exec();
    return customResponse.successResponse('monthly missed cleanings', result, res)
})

const currentMssManager = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const managerId = req.auth.userId
    const {facilityId} = req.query
    const { date } = req.query;

    const role = getLoggedInUserRoleName(req)
    let assetIds 
    if(role == Roles.MANAGER){ 
        const managerAssetService = await getAllAssetsForManager(managerId, facilityId as string)
        if(!managerAssetService.found){ 
            return customResponse.successResponse(managerAssetService.message, [], res)
        }
        assetIds = managerAssetService.data.map(asset => asset._id)
    }else if((role == Roles.INSPECTOR) || (role == Roles.SUPERVISOR)){ 
        const inspectorAssetService = await getAssetsForInspector(managerId, facilityId as string)
        if(!inspectorAssetService.found){ 
            return customResponse.successResponse(inspectorAssetService.message, [], res)
        }
        assetIds = inspectorAssetService.data.map(asset => asset._id)
    }else{ 
        const assets = await RoomDetailModel.find()
        assetIds = assets.map(item => item._id)
    }
    

    // get the asset task 
    const assetTaskTypes = await AssetTaskType.find({assetId: {$in: assetIds}}).populate('cleaningType cleaningTypeFrequency roomId assetId')

    const assetTaskTypeIds = assetTaskTypes.map(assetTask => assetTask._id)

    let currentDate: Date | null | string = null;
    let today
    let query: any = {};

    // Parse the date query parameter
    if (date === 'today') {
        currentDate = getCurrentDateInLosAngelesFormatted()
   } else if (date === 'tomorrow') {
       currentDate = getNextDateInLosAngelesFormatted()
       // console.log(currentDate)
   } else if (date === 'yesterday') {  
       currentDate = getPreviousDateInLosAngelesFormatted();
   } else if (date) {
       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
       if(!dateRegex.test(date as string)){
           return customResponse.badRequestResponse('Dates must be in YYYY-MM-DD format', res);
       }
       currentDate = date as string
   } else {
       currentDate = getCurrentDateInLosAngelesFormatted(); // Default to today if no date is 
   }

    const results = await Promise.all(assetTaskTypeIds.map(async (id) => {
        const assetTaskType = assetTaskTypes.find(task => task._id.equals(id));

        let pastWorkOrderTasks;
        let futureWorkOrderTasks
        let mostRecentTask = null;
        let lastCleaned = null;
        let nextScheduledTask = null;
        let assignee = null;
        let inspectorImages: ({ url: String; uploadedAt?: Date; }[] | undefined)[] = [];
        let inspectorNotes: ({ url: String; uploadedAt?: Date; }[] | undefined)[] = []

        if (currentDate) {
            // Get tasks where the scheduled date is less than or equal to the current date
            pastWorkOrderTasks = await WorkOrderTaskModel.findOne({
                assetTaskType: id,
                $expr: {
                    $and: [
                        { $lte: [{ $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" } }, currentDate] }
                    ]
                }
            }).sort({ scheduledDate: -1 }); // Sort by scheduledDate descending

            assignee = await WorkOrderAssigneeModel.findOne({workOrderId: pastWorkOrderTasks?.workOrderId}).populate('team cleaner inspector')

            // console.log(`Past work order: ${pastWorkOrderTasks}`);
            mostRecentTask = pastWorkOrderTasks;
            lastCleaned = mostRecentTask ? mostRecentTask.lastCleaned : 'N/A';

            // Get tasks where the scheduled date is greater than the current date
            futureWorkOrderTasks = await WorkOrderTaskModel.findOne({
                assetTaskType: id,
                $expr: {
                    $and: [
                        { $gt: [{ $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" } }, currentDate] }
                    ]
                }
            }).sort({ scheduledDate: 1 }); // Sort by scheduledDate ascending

            // get the inspector evidence and note for the work order if any 
            const evidence = await InspectorEvidenceModel.find({workOrderTaskId: mostRecentTask?._id, $or: [
                { 'evidence.images.uploadedAt': { $gte: new Date(`${currentDate}T00:00:00.000Z`), $lte: new Date(`${currentDate}T23:59:59.999Z`) } },
                { 'evidence.notes.uploadedAt': { $gte: new Date(`${currentDate}T00:00:00.000Z`), $lte: new Date(`${currentDate}T23:59:59.999Z`) } }
            ]})

            if(evidence.length > 0){ 
                inspectorImages = evidence.map(evidences => evidences.evidence?.images) || []
                inspectorNotes = evidence.map(evidences => evidences.evidence?.images) || []
            }

            // console.log(futureWorkOrderTasks)
            // testing purposes due to lack of data 
            
            
        }
        return {
            assetTaskType,
            workOrderDetails: mostRecentTask ? mostRecentTask : [],
            lastCleaned: lastCleaned,
            pastDue: mostRecentTask ? updatedIsOverDue(mostRecentTask.validCleaningPeriod, mostRecentTask.lastCleaned as unknown as Date, mostRecentTask.isDone, mostRecentTask.isApproved) : 'N/A',
            nextCleaned: futureWorkOrderTasks ? futureWorkOrderTasks.scheduledDate : 'N/A',
            team: assignee ? assignee.team : 'N/A',
            cleaner: assignee ? assignee.cleaner : 'N/A',
            supervisor: assignee ? assignee.inspector : 'N/A',
            inspectorImages: inspectorImages, 
            inspectorNotes: inspectorNotes
        };
    }));

    return customResponse.successResponse('mss by asset fetched for manager', results, res)
})

const currentMssStatus = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const managerId = req.auth.userId
    const {facilityId} = req.query
    const { filter } = req.body;

    const currentDate = getCurrentDateInLosAngelesFormatted()
    const role = getLoggedInUserRoleName(req)
    let assetIds 
    if(role == Roles.MANAGER){ 
        const managerAssetService = await getAllAssetsForManager(managerId, facilityId as string)
        if(!managerAssetService.found){ 
            return customResponse.successResponse(managerAssetService.message, [], res)
        }
        assetIds = managerAssetService.data.map(asset => asset._id)
    }else if((role == Roles.INSPECTOR) || (role == Roles.SUPERVISOR)){ 
        const inspectorAssetService = await getAssetsForInspector(managerId, facilityId as string)
        if(!inspectorAssetService.found){ 
            return customResponse.successResponse(inspectorAssetService.message, [], res)
        }
        assetIds = inspectorAssetService.data.map(asset => asset._id)
    }else{ 
        const assets = await RoomDetailModel.find()
        assetIds = assets.map(item => item._id)
    }
    

    // get the asset task 
    const assetTaskTypes = await AssetTaskType.find({assetId: {$in: assetIds}}).populate('cleaningType cleaningTypeFrequency roomId assetId')

    const assetTaskTypeIds = assetTaskTypes.map(assetTask => assetTask._id)

    const results = await Promise.all(assetTaskTypeIds.map(async (id) => {
        const assetTaskType = assetTaskTypes.find(task => task._id.equals(id));
        let inspectorImages: ({ url: String; uploadedAt?: Date; }[] | undefined)[] = [];
        let inspectorNotes: ({ url: String; uploadedAt?: Date; }[] | undefined)[] = []

        const workOrderTask = await getFilteredMss(filter, id)
        if (!workOrderTask) {
            return null; // Return null if workOrderTask is null
        }
        const workOrderAssignee = await WorkOrderAssigneeModel.findOne({workOrderId: workOrderTask?.workOrderId}).populate('team cleaner inspector')
        // get the inspector evidence and note for the work order if any 
        const evidence = await InspectorEvidenceModel.find({workOrderTaskId: workOrderTask?._id, $or: [
            { 'evidence.images.uploadedAt': { $gte: new Date(`${currentDate}T00:00:00.000Z`), $lte: new Date(`${currentDate}T23:59:59.999Z`) } },
            { 'evidence.notes.uploadedAt': { $gte: new Date(`${currentDate}T00:00:00.000Z`), $lte: new Date(`${currentDate}T23:59:59.999Z`) } }
        ]})

        if(evidence.length > 0){ 
            inspectorImages = evidence.map(evidences => evidences.evidence?.images) || []
            inspectorNotes = evidence.map(evidences => evidences.evidence?.images) || []
        }

        return{ 
            // assetTaskType,
            workOrderDetails: workOrderTask,
            team: workOrderAssignee ? workOrderAssignee.team : 'N/A',
            cleaner: workOrderAssignee ? workOrderAssignee.cleaner : 'N/A',
            supervisor: workOrderAssignee ? workOrderAssignee.inspector : 'N/A',
            inspectorImages: inspectorImages, 
            inspectorNotes: inspectorNotes
        }
    }))
    // Filter out null results before returning the response
    const filteredResults = results.filter(result => result !== null);

    return customResponse.successResponse('current mss', filteredResults, res);
})

const facilityMonthlyMissedCleaning = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const managerId = req.auth.userId
    const {facilityId} = req.query

    // get all the assets in the facility 
    const managerService = await getAllAssetsForManager(managerId, facilityId as string)
    const assetIds = managerService.data.map(asset => asset._id)

    const currentDate = getCurrentDateInLosAngeles();
    const endOfYesterday = new Date(currentDate);
    endOfYesterday.setDate(currentDate.getDate() - 1);

    const result = await WorkOrderTaskModel.aggregate([
        {
            $match: {
                $and: [
                    { scheduledDate: { $lte: endOfYesterday } }, // Up to yesterday
                    { isDone: false },
                    { isApproved: false },
                    { active: true },
                    { assetId: { $in: assetIds } } // Filter by asset IDs
                ]
            }
        },
        {
            $project: {
                year: { $year: "$scheduledDate" },
                month: { $month: "$scheduledDate" }
            }
        },
        {
            $group: {
                _id: { year: "$year", month: "$month" },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.year": -1, "_id.month": -1 }  // Sort by year and month in descending order
        }
    ]).exec();

    return customResponse.successResponse('monthly missed cleanings for manager facility', result, res);
})

const facilityTopMonthlyMissed = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const currentDate = getCurrentDateInLosAngeles();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    
    const managerId = req.auth.userId;
    const { facilityId } = req.query;

    // Get all the assets in the facility
    const managerService = await getAllAssetsForManager(managerId, facilityId as string);
    const assetIds = managerService.data.map(asset => asset._id);

    const result = await WorkOrderTaskModel.aggregate([
        {
            $match: {
                scheduledDate: { $lte: yesterday }, // Up to yesterday
                isDone: false,
                isApproved: false,
                active: true,
                assetId: { $in: assetIds } // Filter by asset IDs in the facility
            }
        },
        {
            $group: {
                _id: "$assetId",  // Group by the asset ID
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }  // Sort by the count of missed cleanings in descending order
        },
        {
            $limit: 5  // Get the top 5 items
        },
        {
            $lookup: {
                from: "roomdetails", // Name of the collection for RoomDetailModel
                localField: "_id",
                foreignField: "_id",
                as: "assetDetails"
            }
        },
        {
            $unwind: "$assetDetails"
        },
        {
            $project: {
                assetId: "$_id",
                count: 1,
                assetName: "$assetDetails.name"  // Project the asset name field
            }
        }
    ]).exec();

    return customResponse.successResponse('top 5 monthly missed cleanings for facility', result, res);
});

const assetTaskSchedule = catchAsync(async (req:AuthenticatedRequest, res:Response) =>{ 
    const {assetTaskType} = req.query
    // get all the workOrderTask for this assetTaskType 
    const existingType = await AssetTaskType.findById(assetTaskType)
    if(!existingType){ 
        return customResponse.successResponse('No such id', [], res)
    }
    const allWorkOrderTask = await WorkOrderTaskModel.find({assetTaskType: assetTaskType}).populate({
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
    }).sort({ scheduledDate: 1 })
    // add inspector evidence if any 
    const result = await Promise.all(allWorkOrderTask.map(async (tasks) => { 
        const inspectorEvidence = await InspectorEvidenceModel.find({workOrderTaskId: tasks._id}).populate('inspector')
        return{ 
            workOrderTask: tasks, 
            workOrderEvidence: inspectorEvidence, 
            pastDue: tasks ? updatedIsOverDue(tasks.validCleaningPeriod, tasks.lastCleaned as unknown as Date, tasks.isDone, tasks.isApproved) : 'N/A'
        }
    }))
    return customResponse.successResponse('Asset schedule fetched', result, res)
})
export default { 
    getMssTable, 
    currentMss,
    monthlyMissedCleaning,
    topMissedMonthlyCleaning,
    currentMssManager, 
    facilityMonthlyMissedCleaning, 
    facilityTopMonthlyMissed, 
    assetTaskSchedule,
    currentMssStatus
}