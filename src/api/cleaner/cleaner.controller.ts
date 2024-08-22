import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import customResponse from "../../helpers/response";
import TaskModel from "../../models/task";
import {
  CleanerRoomDetails,
  TaskWithRoomDetails,
} from "../../validator/cleaner";
import RoomDetailModel from "../../models/roomDetail";
import Timer from "../../models/timer";
import Location from "../../models/location";
import RoomCleaningItems from "../../models/roomCleaningItems";
import CleanerStartTimeModel from "../../models/cleanerStartTime";
import mongoose from "mongoose";
import staffStartTimeModel from "../../models/cleanerStartTime";
import RequestCleaningItems from "../../models/cleaningItemsRequest";
import ActualTime from "../../models/actualTime";
import RoomModel from "../../models/room";
import User from "../../models/user";
import notificationController from "../notifications/notification.controller";
import { createChildLogger } from "../../utils/childLogger";

const moduleName = '[cleaner/controller]'
const Logger = createChildLogger(moduleName)

const activeTasks = async(req:AuthenticatedRequest, res:Response) => {
  try {
    const cleanerId = req.auth.userId
    // Get the tasks that the isSubmitted is false 
    const activeTasks = await TaskModel.find({assigned_cleaner: cleanerId, isSubmitted: false})
    return customResponse.successResponse('fetched', activeTasks.length, res)
  } catch (error:any) {
    Logger.error('activeTasks Cleaner', error)
    return customResponse.serverErrorResponse('An error occurred in the get active tasks for cleaner', res, error)
  } 
}

const allFacilitiesCleaned = async(req:AuthenticatedRequest, res:Response) => { 
  try {
    const cleanerId = req.auth.userId
    const allFacilities = await TaskModel.find({assigned_cleaner: cleanerId, isSubmitted: true})
    return customResponse.successResponse('fetched', allFacilities.length, res)
  } catch (error:any) {
    Logger.error('all Facilities cleaned cleaner',error)
    return customResponse.serverErrorResponse('An error occurred in the get all facilities cleaner for cleaner', res, error)
  }
}

const overAllPerformance = async(req:AuthenticatedRequest, res:Response) => { 

}

const getRoomLocation = async (req: AuthenticatedRequest, res: Response) => {
  const cleanerId = req.auth.userId; // Assuming req.auth.userId represents the ID of the logged-in cleaner
  const formattedLocationData = [];
  try {
      // Find the cleaner's task(s) that task stage is set to clean
      const uniqueLocationIds = await TaskModel.distinct('assigned_location', {
        assigned_cleaner: cleanerId,
        task_stage: 'clean'
      }).exec();
      
      for (const uniqueLocation of uniqueLocationIds) {
        try {
          const locationDetails = await Location.findById(uniqueLocation).exec();
      
          if (locationDetails) {
            // Access the country, state, city, or any other information in your Location model
            const { country, state, city, postal_code, facility_name } = locationDetails;
      
            const locationData = {
              id: uniqueLocation,
              facility_name,
              country,
              state,
              city,
              postal_code
            };

            // Push the formatted data to the array
            formattedLocationData.push(locationData);
          } else {
            Logger.info(`Location with ID ${uniqueLocation} not found`);
          }
        } catch (error) {
          Logger.error(`Error fetching location details for ID ${uniqueLocation}:`, error);
        }
      }
      return customResponse.successResponse("fetched",formattedLocationData,res);
    }catch (error) {
      Logger.error("Error fetching cleaner's tasks or locations:", error);
      // Handle the error
    }
}

const getAllRooms = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // get all the rooms that the logged in cleaner is assigned to clean
  try {
    const cleanerId = req.auth.userId;
    const locationId = req.query.locationId

    if(!locationId) return customResponse.badRequestResponse('Missing required query param <locationId>', res);

    const taskWithRoomDetails = (await TaskModel.find({
      assigned_cleaner: cleanerId, assigned_location: locationId,  isSubmitted: false, task_stage: 'clean'
    }).populate('assigned_room'))

    if(!taskWithRoomDetails) return customResponse.successResponse('There is no room currently', {}, res)


    const cleanerRooms = await Promise.all(taskWithRoomDetails.map(async (task) => {
      try{
        let roomId = 'N/A';
        let roomName = 'N/A';
        if (task.assigned_room) {
          const roomDetails = await RoomModel.findById(task.assigned_room._id);
          if (!roomDetails) {
            return customResponse.badRequestResponse(
              "There is no room with that id",
              res
            );
          }
          roomId = roomDetails._id;
          roomName = roomDetails.roomName;
        }
    
        
        return {
          taskId: task.id,
          roomId: roomId,
          roomName: roomName,
          scheduled_date: task.scheduled_date, 
        };
  
      }catch(error: any){ 
        Logger.error(`error processing task => ${task._id}`)
      }
      
    }));
    
    const data = { cleanerRooms };
    return customResponse.successResponse('Get room for cleaner', data, res)
    }catch (err: any) {
    Logger.error('get all rooms cleaner',err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get all rooms for cleaner endpoint",
      res,
      err
    );
  }
};

const getRoomDetailsById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const cleanerId = req.auth.userId;
    const taskId = req.query.taskId;

    // Get the task details of the room id
    const roomDetails = await TaskModel.findOne({
      _id: taskId,
      isSubmitted: false,
      assigned_cleaner: cleanerId,
    }).populate("tasks");

    if (!roomDetails)
      return customResponse.badRequestResponse(
        "There is no item to clean in this room",
        res
      );

    const filteredTasks = roomDetails.tasks.filter((item) => !item.isDone);

    return customResponse.successResponse(
      "Details fetched",
      filteredTasks,
      res
    );
  } catch (error: any) {
    Logger.error('getRoomDetailsById',error);
    return customResponse.serverErrorResponse(
      "Oops.. something occurred in the get room by id for cleaners endpoint",
      res,
      error
    );
  }
};

const getCleaningItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.query.taskId;
    const cleaningDetails = await RoomCleaningItems.findOne({
      task_id: taskId,
    });

    // Filter cleaning items where cleaner_cleaning_items is an empty array
    const filteredCleaningItems = cleaningDetails?.cleaning_items.filter(
      (items: any) => items.cleaner_cleaning_items.length == 0
    );

    return customResponse.successResponse(
      "Room cleaning items fetched",
      filteredCleaningItems,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get cleaning items endpoint for cleaners",
      res,
      error
    );
  }
};

const uploadDetailImages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const taskId = req.query.taskId;
    const inputs = req.body.inputs || [];
    const general_evidence = req.body.general_evidence || []

    // Check if the general_evidence for that task is empty
    const existingCleanerGeneral = await TaskModel.findById(taskId);
    if (!existingCleanerGeneral) {
      await session.abortTransaction();
      session.endSession();
      return customResponse.badRequestResponse("Wrong task Id", res);
    }

    if (existingCleanerGeneral.cleaner_general_evidence.length === 0) {
      existingCleanerGeneral.cleaner_general_evidence = general_evidence;
    } else {
      existingCleanerGeneral.cleaner_general_evidence.push(...general_evidence);
    }

    const inputDetailIdCheck = await Promise.all(
      inputs.map(async (detailData: any) => {
        const check = await TaskModel.find({
          _id: taskId,
          "tasks._id": detailData.detail_id,
        });
        return { detail_id: detailData.detail_id, found: check.length > 0 };
      })
    );

    const incorrectDetailIds = inputDetailIdCheck
      .filter((check) => !check.found)
      .map((check) => check.detail_id);

    if (incorrectDetailIds.length > 0) {
      await session.abortTransaction();
      session.endSession();
      const errorMessage = `The following detail_ids do not belong to the taskId passed: ${incorrectDetailIds.join(
        ", "
      )}`;
      return customResponse.badRequestResponse(`${errorMessage}`, res);
    }

    for (const detailsData of inputs) {
      await TaskModel.updateOne(
        { "tasks._id": detailsData.detail_id },
        { $set: { "tasks.$.image": detailsData.image_path } },
        { session }
      );
    }

    // Save the updated task within the transaction
    await existingCleanerGeneral.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return customResponse.successResponse(
      "Tasks images updated successfully",
      {},
      res
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    await session.abortTransaction();
    session.endSession();
    return customResponse.serverErrorResponse(
      "Oops.. something occurred in the update image for cleaners endpoint",
      res,
      error
    );
  }
};


const confirmCleaningItems = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const cleanerId = req.auth.userId;
    const taskId = req.query.taskId;
    const { cleanerItems, roomId } = req.body;
    const assignedInspectorId = await TaskModel.findById(taskId);
    const assignedInspector = await User.findById(assignedInspectorId);
    const assignedInspectorNotificationToken =
      assignedInspector?.notificationToken;

    const cleaningDetails = await RoomCleaningItems.findOne({
      task_id: taskId,
      room_id: roomId,
    });
    if (!cleaningDetails)
      return customResponse.badRequestResponse(
        "There is no task with that id",
        res
      );

    for (const { cleaning_id, quantityReceived } of cleanerItems) {
      // find the cleaning_id in the cleaningDetails
      const cleaningItem = cleaningDetails.cleaning_items.find(
        (item) => item.cleaning_id.toString() === cleaning_id.toString()
      );

      if (!cleaningItem) {
        return customResponse.badRequestResponse(
          `Cleaning item with ID ${cleaning_id} not found`,
          res
        );
      }
      // if cleaning id is found, update it with the necessary cleanerId and quantity received
      cleaningItem.cleaner_cleaning_items.push({
        cleaner_id: cleanerId,
        quantity_assigned: quantityReceived,
      });
    }
    await cleaningDetails.save();

    if(assignedInspectorNotificationToken !== undefined){ 
      notificationController.sendNotification(
        assignedInspectorNotificationToken,
        "Cleaning Items",
        "A cleaner has recently confirmed the available cleaning items"
      );
    }
    
    return customResponse.successResponse(
      "Cleaner cleaning items confirmed successfully",
      cleaningDetails,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred while confirming cleaning items",
      res,
      error
    );
  }
};

const requestCleaningItems = async(req:AuthenticatedRequest, res:Response) => { 
  try {
    const {requestedCleaningData} = req.body
    const {taskId} = req.query

    if(!taskId) return customResponse.badRequestResponse("The task Id is required", res)
    // check if there is a requested item for this task 
    let cleaningItemRequest = await RequestCleaningItems.findOne({task_id: taskId})
    if(!cleaningItemRequest){ 
      cleaningItemRequest = await RequestCleaningItems.create({
        task_id: taskId, 
        requested_items: requestedCleaningData.map((item: { cleaning_id: any; unit:String; item_name: string; asking_quantity: Number; comment: string; }) => ({ 
          cleaning_id: item.cleaning_id, 
          item_name: item.item_name, 
          quantity: item.asking_quantity, 
          cleaner_reason: item.comment,
          unit: item.unit
        }))
      })
    }else{ 
      requestedCleaningData.forEach((item:{ cleaning_id: mongoose.Types.ObjectId; item_name: String; asking_quantity: Number; unit: String; comment: String; }) => {
        cleaningItemRequest?.requested_items.push({
          _id: new mongoose.Types.ObjectId,
          cleaning_id: item.cleaning_id,
          item_name: item.item_name,
          quantity: item.asking_quantity,
          cleaner_reason: item.comment,
          unit: item.unit,
          inspector_reason: "No comment",
          approved: false, 
          completed: false,
        });
      })
    }
  await cleaningItemRequest.save()

  // send a notification to the inspector that a request has been sent
  return customResponse.successResponse('Request sent', cleaningItemRequest, res)
  } catch (error: any) {
    Logger.error(error)
    return customResponse.serverErrorResponse("An error occurred in the request cleaning items endpoint", res, error)
  }

}

const cleanerTaskSummary = async(req:AuthenticatedRequest, res:Response) => { 
  try{
    const cleanerId = req.auth.userId
    const tasks = await TaskModel.find({assigned_cleaner: cleanerId}).sort({_id: 1}).populate('planned_time assigned_room').populate({
      path: 'assigned_cleaner assigned_inspector',
      model: 'User'
     })
    const actualTime = await Promise.all(tasks.map(async (task) => {
      const getTime = await ActualTime.findOne({task_id: task._id})
      return getTime
    }))
    const data = {tasks, actualTime}
    return customResponse.successResponse('task summary for cleaner', data, res)
  
  }catch(error: any){ 
    Logger.error(error)
    return customResponse.serverErrorResponse('An error occurred in the get cleaner task summary', res, error)
  }
  
}


export default {
  activeTasks, 
  allFacilitiesCleaned, 
  overAllPerformance,
  getRoomLocation,
  getAllRooms,
  getRoomDetailsById,
  getCleaningItems,
  uploadDetailImages,
  requestCleaningItems, 
  confirmCleaningItems, 
  cleanerTaskSummary
}
