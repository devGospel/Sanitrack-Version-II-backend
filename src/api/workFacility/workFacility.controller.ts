import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from 'express';
import customResponse from "../../helpers/response";
import FacilityWorkOrderModel from "../../models/workFacility";
import { convertToTime } from "../../utils/date";
import FacilityTimerModel from "../../models/facilityTimer";
import { calculateNextDate } from "../../utils/frequency";
import TaskModel from "../../models/task";
import User from "../../models/user";
import UserRoles from "../../models/userRoles";
import PreWorkFacilityModel from "../../models/saveWorkFacility";
import { createChildLogger } from "../../utils/childLogger";
import { getFacilityCurrentStage } from "../../utils/facilityCurrentStage";

const moduleName = "[work facility/controller]";
const Logger = createChildLogger(moduleName);

const addFacilityWorkOrder = async(req:AuthenticatedRequest, res:Response)=> { 
    try {
        const {assigned_supervisors, stages, facility_id, scheduled_date, repeat} = req.body
        
        const formattedStages = stages.map((stage: { name: any; stage_hour: string; stage_minute: string; }) => ({
            name: stage.name,
            start_time: convertToTime( stage.stage_hour, stage.stage_minute, scheduled_date)
        }))

        // check if a facility work order has been created for this facility_id before with the scheduled date for any of the assigned supervisors 
        const check = await FacilityWorkOrderModel.findOne({facility_id: facility_id, scheduled_date: scheduled_date, assigned_supervisors: {$in:assigned_supervisors},  completed: false})

        if(check !== null) return customResponse.badRequestResponse('This facility has a work order with the one or more of the assigned supervisor for the scheduled date that has not been released! Cannot create a new one', res)
        const scheduled_repeat_date = new Date(scheduled_date)
    
        const new_scheduled_date = new Date(scheduled_date)
        new_scheduled_date.setHours(0,0,0,0)
        // Logger.info(`scheduled date => ${scheduled_repeat_date}`)

        const repeatDate = calculateNextDate(scheduled_repeat_date, repeat)
        // Logger.info(`repeat date => ${repeatDate}`)

        await FacilityWorkOrderModel.create({
            scheduled_date: new_scheduled_date,
            facility_id: facility_id,
            assigned_supervisors: assigned_supervisors, 
            repeat_date: repeatDate, 
            stages: formattedStages
        })
        
        return customResponse.successResponse('created', {}, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred when creating a work facility order', res, error)
    }
}

const getFacilityWorkOrder = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const {work_order_id} = req.query

        if(!work_order_id) return customResponse.badRequestResponse("The facility timing id is required", res)

        const facilityTiming = await FacilityWorkOrderModel.findById(work_order_id).populate("facility_id assigned_rooms assigned_supervisors")
        if(!facilityTiming) return customResponse.badRequestResponse('There is no facility with the passed id for you', res)

        return customResponse.successResponse('fetched', facilityTiming, res)

    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse("An error occurred when getting the facility timing details for this inspector", res, error)
    }
}

// get all presaved and get all assigned
const getAllFacilityWorkOrder = async(req:AuthenticatedRequest, res:Response) => { 
    try {
        const facilityTimingQuery = FacilityWorkOrderModel.find().populate("facility_id assigned_supervisors").sort({ _id: -1 });

        const [totalFacilityTiming, allFacilityTiming] = await Promise.all([
            FacilityWorkOrderModel.countDocuments(),
            facilityTimingQuery.exec(),
        ]);

        // Prepare data to send in the response
        const data = {
            totalFacilityTiming,
            allFacilityTiming: allFacilityTiming,
        };
     

        return customResponse.successResponse('fetched', data, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse("An error occurred when getting all the facility work order", res, error)
    }
}

const getFacilityWorkOrderDetails = async(req:AuthenticatedRequest, res:Response) =>{ 
    try {
        const {work_order_id} = req.query
        if(!work_order_id) return customResponse.badRequestResponse('The facility timing id is required', res)

        const facilityTiming = await FacilityWorkOrderModel.findById(work_order_id).populate("facility_id assigned_supervisors assigned_rooms")
        if(!facilityTiming) return customResponse.badRequestResponse("There is no facility timing for the work order passed", res)

        const FacilityStages = await Promise.all(facilityTiming.stages.map(async (plannedStage) => { 
            const actualFacilityTiming = await FacilityTimerModel.findOne({work_order_facility: work_order_id, "stages.name": plannedStage.name})

            if(!actualFacilityTiming){ 
                return{ 
                    name: plannedStage.name,
                    actual_stage_start: null, 
                    actual_stage_stop: null, 
                    started_by: null, 
                    stopped_by: null
                }
            }

            // get the stage name time 
            const matchedStageTimer = actualFacilityTiming.stages.find(timer => timer.name === plannedStage.name)
            if(!matchedStageTimer){ 
                return{ 
                    name: plannedStage.name,
                    actual_stage_start: null, 
                    actual_stage_stop: null, 
                    started_by: null, 
                    stopped_by: null
                }
            }
            if(matchedStageTimer){ 
                return{ 
                    name: plannedStage.name, 
                    actual_stage_start: matchedStageTimer.actual_stage_start_time, 
                    actual_stage_stop: matchedStageTimer.actual_stage_stop_time, 
                    started_by: matchedStageTimer.started_by, 
                    stopped_by: matchedStageTimer.stoped_by
                }
            }
        }))
     
        const currentStage = getFacilityCurrentStage(FacilityStages)
        return customResponse.successResponse("single facility timing details fetched", {facilityTiming, FacilityStages, currentStage}, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse("An error occurred when getting the details of the facility work order",res, error)
    }
}
const saveFacilityWorkOrder = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const {facility_id, stages} = req.body 
        const formattedStages = stages.map((stage: { name: any; stage_hour: string; stage_minute: string; }) => ({
            name: stage.name,
            start_time: convertToTime(stage.stage_hour, stage.stage_minute)
        }))

        const save = await PreWorkFacilityModel.create({ 
            facility_id: facility_id, 
            stages: formattedStages
        })

        return customResponse.successResponse('saved', save, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse("An error occurred when saving a facility work order", res, error)

    }
}
const getAllPreSavedFacilityWorkOrder = async(req:AuthenticatedRequest, res:Response) => {
    try {
        const result = await PreWorkFacilityModel.find().sort({_id: -1}).populate("facility_id")
        
        return customResponse.successResponse('all presaved fetched', result, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse("An error ocurred when getting all the presaved facility", res, error)
    }
}
const getSavedFacilityWorkOrder = async(req:AuthenticatedRequest, res:Response) => { 
    try {
        const {facility_id} = req.query
        if(!facility_id) return customResponse.badRequestResponse("The location id is required", res)

        const preSavedFacilities = await PreWorkFacilityModel.find({facility_id: facility_id})
        if(!preSavedFacilities) return customResponse.successResponse("This facility does not have any presaved facility timing", {}, res)
        return customResponse.successResponse('fetched', preSavedFacilities, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse("An error occurred when getting all the saved facility timing for this location", res, error)
        
    }
}

// get the presaved details
const preSavedFacilityTimingDetails = async(req:AuthenticatedRequest, res:Response) => { 
    try {
        const {pre_saved_id} = req.query
        if(!pre_saved_id) return customResponse.badRequestResponse('pre-saved facility timing id is required', res)

        const result = await PreWorkFacilityModel.findById(pre_saved_id)
        return customResponse.successResponse('Pre-saved details',result, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred when getting the details of the presaved facility', res, error)
    }
}

const updatePreSavedFacilityWorkOrder = async(req:AuthenticatedRequest, res:Response) => { 
    try {
        const {stages} = req.body
        const {pre_saved_id} = req.query

        const formattedStages = stages.map((stage: { name: any; stage_hour: string; stage_minute: string; }) => ({
            name: stage.name,
            start_time: convertToTime(stage.stage_hour, stage.stage_minute)
        }))

        await PreWorkFacilityModel.findByIdAndUpdate(pre_saved_id, {stages: formattedStages })
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse("An error occurred when updating the presaved facility timer", res, error)
        
    }
}
const getUsers = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const userIDs = await UserRoles.find({ role_name: { $ne: 'Admin' } })
        .distinct('user_id')
        .sort({ _id: -1 });

        if(!userIDs) return customResponse.successResponse('There are no cleaners or inspectors',{}, res)
        const users = await User.find({ _id: { $in: userIDs }, flag: 'ACTIVE' }).sort({_id: 1}).populate('username');
        if(!users) return customResponse.badRequestResponse('There are no users to assign', res)
        return customResponse.successResponse('users', users, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred when getting all the users', res,error)
    }
}
const workFacilityDashboard = async(req:AuthenticatedRequest, res:Response) => { 
    try {
        // show him all the facility work order for the current day 
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const result = await FacilityWorkOrderModel.find({scheduled_date: today}).populate('assigned_supervisors facility_id')

        if(!result) return customResponse.successResponse('No scheduled task', {}, res)
        
        const resultWithActualTime = [];

        for(const resultItem of result){ 
            const actualTime = await FacilityTimerModel.findOne({work_order_facility: resultItem._id});
            // Push an object containing both resultItem and actualTime to the resultWithActualTime array
            resultWithActualTime.push({resultItem, actualTime});
        }
        
        return customResponse.successResponse('fetched', resultWithActualTime, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred when getting the facility for manager', res, error)
    }
}

const overAllPerformance = async(req:AuthenticatedRequest, res:Response) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const stageCount:{[key: string]: number} = { 
            clean: 0, 
            preop: 0, 
            inspect: 0, 
            release: 0
        }

        // initialize the facility stage count 
        const facilityStageCount:{[key: string]: number} = { 
            clean: 0, 
            preop: 0, 
            inspect: 0, 
            release: 0
        }

        // initialize the facility name
        const facilityNamesByStage:{[key: string]: string[]} = { 
            clean: [], 
            preop: [], 
            inspect: [], 
            release: []
        }

        // get the facility timing scheduled for the current date 
        const facilityTiming = await FacilityWorkOrderModel.find({scheduled_date: today}).populate("facility_id")

        if(!facilityTiming){
            return customResponse.successResponse('There is no facility to be cleaned today', stageCount, res)
        }
        
        // for each of the facilityTiming, get the facilityTimer details from the facilityTimerModel
        await Promise.all(facilityTiming.map(async (facility: any) => {
            const facilityTimer = await FacilityTimerModel.findOne({work_order_facility: facility._id})

            // if there is no facilityTimer for the facility, assume that the stage is clean so update the objects accordingly
            if(!facilityTimer){ 
                stageCount.clean += 1
                facilityStageCount.clean += 1
                facilityNamesByStage['clean'].push(facility.facility_id?.facility_name ?? "N/A")
            }
            
            if(facilityTimer){ 
                // get the most current stage for that facility timer 
                const stageLength = facilityTimer?.stages.length
                const mostCurrentFacilityStage:string = facilityTimer?.stages[stageLength - 1].name as string
                  // update the objects based on the mostCurrentFacilityStage
                stageCount[mostCurrentFacilityStage]++
                facilityStageCount[mostCurrentFacilityStage]++
                facilityNamesByStage[mostCurrentFacilityStage].push(facility.facility_id?.facility_name ?? "N/A")
            }
            
        }))
        // Calculate percentage for each stage
        const percentageStages: { [key: string]: { percentage: number, facilityNames: string[] } } = {};
        for (const stage in stageCount) {
            // Ensure stage is a valid property of stageCount
            if (stageCount.hasOwnProperty(stage)) {
                const totalCount = facilityStageCount[stage];
                const count = stageCount[stage];
                let percentage: number;
                // Handle division by zero
                if (totalCount === 0) {
                    percentage = 0; // or set to another value of your choice
                } else {
                    percentage = (count / totalCount) * 100;
                }
                percentageStages[stage] = {
                    percentage,
                    facilityNames: facilityNamesByStage[stage]
                };
            }
        }

        return customResponse.successResponse('overall cleaning performance', percentageStages, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse("An error occurred when getting the overall performance for facility cleaning overview", res, error)
        
    }
}

export default{ 
    addFacilityWorkOrder,
    getUsers,
    workFacilityDashboard, 
    saveFacilityWorkOrder, 
    getSavedFacilityWorkOrder, 
    preSavedFacilityTimingDetails, 
    updatePreSavedFacilityWorkOrder,
    getFacilityWorkOrder, 
    getAllFacilityWorkOrder, 
    getFacilityWorkOrderDetails,
    getAllPreSavedFacilityWorkOrder, 
    overAllPerformance
}
