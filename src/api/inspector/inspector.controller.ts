import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import TaskModel from "../../models/task";
import customResponse from "../../helpers/response";
import { TaskWithRoomDetails } from "../../validator/cleaner";
import Location from "../../models/location";
import ActualTime from "../../models/actualTime";
import { sumArray } from "../../utils/reducer";
import staffStartTimeModel from "../../models/cleanerStartTime";
import RequestCleaningItems from "../../models/cleaningItemsRequest";
import CleaningItems from "../../models/cleaningItems";
import mongoose from "mongoose";
import RoomCleaningItems from "../../models/roomCleaningItems";
import RoomModel from "../../models/room";
import User from "../../models/user";
import notificationController from "../notifications/notification.controller";
import { createChildLogger } from "../../utils/childLogger";
import FacilityWorkOrderModel from "../../models/workFacility";
import FacilityTimerModel from "../../models/facilityTimer";
import InspectorEvidence from "../../models/inspectorEvidence";


const moduleName = "[inspector/controller]";
const Logger = createChildLogger(moduleName);

const activeTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const inspectorId = req.auth.userId;
    // Get the tasks that the isSubmitted is false
    const activeTasks = await TaskModel.find({
      assigned_inspector: inspectorId,
      isSubmitted: false,
    });
    return customResponse.successResponse("fetched", activeTasks.length, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get active tasks for inspector",
      res,
      error
    );
  }
};

const allFacilitiesCleaned = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const inspectorId = req.auth.userId;
    const allFacilities = await TaskModel.find({
      assigned_inspector: inspectorId,
      isSubmitted: true,
    });
    return customResponse.successResponse("fetched", allFacilities.length, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get all facilities for inspector",
      res,
      error
    );
  }
};

const getRoomLocation = async (req: AuthenticatedRequest, res: Response) => {
  const inspectorId = req.auth.userId; // Assuming req.auth.userId represents the ID of the logged-in cleaner
  const formattedLocationData = [];
  try {
    // Find the cleaner's task(s) that isSubmitted is set to false
    const uniqueLocationIds = await TaskModel.distinct("assigned_location", {
      assigned_inspector: inspectorId,
      isSubmitted: false,
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
            postal_code,
          };

          // Push the formatted data to the array
          formattedLocationData.push(locationData);
        } else {
          console.log(`Location with ID ${uniqueLocation} not found`);
        }
      } catch (error) {
        console.error(
          `Error fetching location details for ID ${uniqueLocation}:`,
          error
        );
      }
    }

    return customResponse.successResponse(
      "fetched",
      formattedLocationData,
      res
    );
  } catch (error) {
    console.error("Error fetching cleaner's tasks or locations:", error);
    // Handle the error
  }
};

const getInspectorRoom = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const inspectorId = req.auth.userId;

    const locationId = req.query.locationId;
    if (!locationId)
      return customResponse.badRequestResponse(
        "Missing required query param <locationId>",
        res
      );

    const taskWithRoomDetails = await TaskModel.find({
      assigned_inspector: {$in: inspectorId},
      assigned_location: locationId,
      isSubmitted: false,
    }).populate("assigned_room");

    if (taskWithRoomDetails.length === 0) {
      return customResponse.createResponse(
        "There is no room to supervise currently.",
        null,
        res
      );
    }

    const inspectorRooms = await Promise.all(
      taskWithRoomDetails.map(async (task) => {
        try {
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
          
          // const cleanerStartTime = await staffStartTimeModel.findOne({
          //   task_id: task._id,
          //   staff_role: "Cleaner",
          // });
          
          return {
            taskId: task._id,
            roomId: roomId,
            roomName: roomName,
            // location: roomDetails.location,
            scheduled_date: task.scheduled_date,
            // cleaner_time: cleanerStartTime?.main_time.start_time,
          };
        } catch (error: any) {
          Logger.error(`Error processing task => ${task._id}`)
        }
        
      })
    );

    const data = { inspectorRooms };
    return customResponse.successResponse("Get room for inspector", data, res);
  } catch (err: any) {
    Logger.error(`This is from get rooms for inspector => ${err}`);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get all rooms for inspector endpoint",
      res,
      err
    );
  }
};

//look at changing this because a multiple tasks can be created for a room so check based on the taskId
const getRoomTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // const roomId = req.query.roomId
    const taskId = req.query.taskId;
    const inspectorId = req.auth.userId;

    if (!taskId)
      return customResponse.badRequestResponse(
        "Missing required query param <taskId>",
        res
      );
    // Get the tasks where isDone is false (meaning that they should see the task that they have not approved of)
    const roomDetails = await TaskModel.findOne(
      { _id: taskId },
      { assigned_inspector: inspectorId },
      { "tasks.isDone": false }
    ).populate("tasks");
    const taskDetails = roomDetails?.tasks
      .filter((task) => !task.isDone)
      .map((task) => ({
        task_id: task._id,
        detail_id: task.roomDetailId,
        name: task.name,
        image_url: task.image,
      }));

    // Now taskDetails will contain an array of objects with only name and image fields
    const data = { taskId: roomDetails?._id, tasks: taskDetails };
    return customResponse.successResponse(
      "Task fetched successfully",
      data,
      res
    );
  } catch (err: any) {
    Logger.error(err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get task for room in the inspector endpoint",
      res,
      err
    );
  }
};

const updateTaskItem = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const inspectorId = req.auth.userId;
  const taskId = req.query.taskId;

  if (!taskId) return customResponse.badRequestResponse("taskId needed", res);
  const passedTasks = req.body.passedTasks || []; // this passedTask is the _id of the 'tasks' in the TaskModel
  let updateIsDone;
  const inspectorTimer = req.body.timer; //time taken to inspect the room basically

  if(passedTasks.length === 0) return customResponse.successResponse('No item approved', {}, res)
  try {
    // Update tasks in a single query
    for (const task of passedTasks) { //this should not be taskId, instead it should be tasks._id
      const taskId = task.taskId;
      // Update the isDone property for each task
      updateIsDone = await TaskModel.updateOne(
        { "tasks._id": taskId, assigned_inspector: inspectorId },
        { $set: { "tasks.$.isDone": true, "tasks.$.last_cleaned": Date.now() } }
      );
    }
    const inspectorActualTimeCheck = await ActualTime.findOne({
      task_id: taskId,
      "preOp_time.inspector_id": inspectorId,
    });

    // if the inspector has not logged a time for the task, update the time for that task
    if (!inspectorActualTimeCheck) {
      await ActualTime.findOneAndUpdate(
        { task_id: taskId },
        {
          $set: {
            "preOp_time.inspector_id": inspectorId,
            "preOp_time.time": inspectorTimer,
          },
        },
        { new: true }
      );
    }

    // Check if all tasks are done
    const roomDetails = await TaskModel.findById(taskId, {
      assigned_inspector: inspectorId,
    }).populate("tasks");

    if (!roomDetails) {
      return customResponse.createResponse(
        "You passed in the wrong taskId",
        {},
        res
      );
    }
    const allTaskDone = roomDetails.tasks.every((task) => task.isDone);

    if (allTaskDone) {
      await TaskModel.findByIdAndUpdate(
        taskId,
        { $set: { isSubmitted: true, task_stage: "release" } },
        { new: true }
      );

      if (inspectorActualTimeCheck) {
        inspectorActualTimeCheck.preOp_time.time.push(inspectorTimer);
        await inspectorActualTimeCheck.save();
      }
      // get the inspector time, sum it with the cleaner time and get the actual release time!
      // if all task is done, I would like to update the inspector time. then update the release time

      if (inspectorActualTimeCheck) {
        const allInspectorTime = inspectorActualTimeCheck?.preOp_time.time;
        const allCleanerTime = inspectorActualTimeCheck?.clean_time.time;

        const allInspectorTimeSum = sumArray(allInspectorTime) as number;
        const allCleanerTimeSum = sumArray(allCleanerTime) as number;

        const releaseTime = allInspectorTimeSum + allCleanerTimeSum;

        inspectorActualTimeCheck.release_time = releaseTime;
        await inspectorActualTimeCheck.save();
      }
      // Send push notification to assigned Cleaner
      const assignedCleanerId = await TaskModel.findById(taskId);
      const cleaner = await User.findById(assignedCleanerId);
      const cleanerNotificationToken = cleaner?.notificationToken;
      if (cleanerNotificationToken !== undefined)
        notificationController.sendNotification(
          cleanerNotificationToken,
          "Task Approval",
          `Your recently completed task has been approved!`
        );

      // update the task_stage to 'release'
      return customResponse.successResponse(
        "All tasks have been approved",
        {},
        res
      );
    } else {
      // so update the task_stage back to 'clean' and then prepare to create the subtask! so at this point they will have to go to the
      // dashboard and sort based on isSubmitted but the isSubmitted sorting is done with checking if any of the tasks.isDone is true
      // await TaskModel.findOneAndUpdate({"assigned_room": roomId},
      // {$set: {"task_stage": 'clean'}},
      // {new: true}
      // )
      await TaskModel.findByIdAndUpdate(
        taskId,
        { $set: { task_stage: "clean" } },
        { new: true }
      );
      if (inspectorActualTimeCheck) {
        inspectorActualTimeCheck.preOp_time.time.push(inspectorTimer);
        await inspectorActualTimeCheck.save();
      }
      //update the inspector actual time too
      console.log("Not all tasks are done");
    }

    return customResponse.successResponse("Approved", updateIsDone, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Error updating tasks",
      res,
      error
    );
  }
};

const getAllCleaningItemsRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const inspectorId = req.auth.userId;
    const inspectorTasks = await TaskModel.find({
      assigned_inspector: inspectorId,
    }).populate("assigned_room");

    // gather all the _id and use them to get all requested cleaning items
    const requestedCleaningItems = await Promise.all(
      inspectorTasks.map(async (task) => {
        const cleaningItems = await RequestCleaningItems.findOne({
          task_id: task._id,
        });
        
        if (!cleaningItems) return "No request";
        
        const cleaningItemFilter = cleaningItems.requested_items.filter(
          (item) => !item.completed
        );
        
        if (cleaningItemFilter.length === 0) return "No request";

        return { task, cleaningItems: cleaningItemFilter };
      })
    );

    const filteredRequestedCleaningItems = requestedCleaningItems.filter(item => item !== "No request");

    return customResponse.successResponse(
      "fetched",
      filteredRequestedCleaningItems,
      res
    );

  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get all cleaning items request endpoint",
      res,
      error
    );
  }
};

const getSingleCleaningItemRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const taskId = req.query.taskId;
    const singleTaskCleaningItem = await RequestCleaningItems.findOne({
      task_id: taskId,
    });
    // only display the one he has not approved
    const filteredCleaningItems =
      singleTaskCleaningItem?.requested_items.filter((item) => !item.completed);

    return customResponse.successResponse(
      "requested cleaning items",
      filteredCleaningItems,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get single cleaning item request endpoint",
      res,
      error
    );
  }
};

const getRequestDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId, taskId } = req.query;
    const request = await RequestCleaningItems.findOne({ task_id: taskId });

    if (!request)
      return customResponse.badRequestResponse(
        "There is no requested cleaning item for this task",
        res
      );
    const requestedItems = request.requested_items.find(
      (item) => item._id.toString() == requestId
    );

    if (!requestedItems)
      return customResponse.badRequestResponse(
        "There is no requested item",
        res
      );

    return customResponse.successResponse(
      "request details",
      requestedItems,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the ger request detail endpoint",
      res,
      error
    );
  }
};
const approveCleaningItems = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // inspector entered the quantity he wants to give to them and now, for each of the item, check if the quantity entered can be assigned (check against the cleaning_items table with the cleaning_id passed)
  // if that is allowed, subtract the quantity he entered from the cleaning_items (this is the inventory)
  // then check if the cleaning_id is already in the rooms_cleaning_items table. if it is, update the quantity (old quantity + new one)
  // if it is not, insert a new one into the room_cleaning_items (this method will not work because I am letting the cleaner approve items once so if the inspector approves and sends back to them, they will not be able to see it so create a new document under the correct task_id)
  const { taskId } = req.query;
  const { inspectorAcceptData } = req.body;
  const insufficientStockItems: string[] = [];

  // inspectorData = [{"approved" : "", "cleaning_id": "", request_id: "", "inspector_comment": ", "item_name": "", "quantity": "", "unit": ""}]
  try {
    // Check if any requested items have zero quantity
    const quantityChecks = await CleaningItems.findById(
      inspectorAcceptData.cleaning_id,
      "quantity"
    );

    if (!quantityChecks)
      return customResponse.badRequestResponse("The quantity is 0", res);

    const itemQuantity = await CleaningItems.findById(
      inspectorAcceptData.cleaning_id
    );
    const deductionQuantity = inspectorAcceptData.quantity;

    const currentQuantity = itemQuantity?.quantity as number;
    const updatedQuantity = currentQuantity - deductionQuantity;

    if (updatedQuantity < 0) {
      return customResponse.badRequestResponse(
        `${inspectorAcceptData.item_name} does not have enough stock`,
        res
      );
    }

    // Update cleaning item quantity
    await CleaningItems.findByIdAndUpdate(inspectorAcceptData.cleaning_id, {
      quantity: updatedQuantity,
    });

    // Update request status
    const request = await RequestCleaningItems.findOne({ task_id: taskId });
    if (!request)
      return customResponse.badRequestResponse(
        "The task does not have a request",
        res
      );

    const requestedItems = request.requested_items.find(
      (item) => item._id.toString() == inspectorAcceptData.request_id
    );
    if (!requestedItems)
      return customResponse.badRequestResponse(
        "No such request id exists",
        res
      );

    requestedItems.approved = true;
    requestedItems.inspector_reason = inspectorAcceptData.inspector_comment;
    requestedItems.completed = true;
    await request.save();

    // Add item to room cleaning items
    const roomCleaningItems = await RoomCleaningItems.findOneAndUpdate(
      { task_id: taskId },
      {
        $push: {
          cleaning_items: {
            cleaning_id: inspectorAcceptData.cleaning_id,
            item_name: inspectorAcceptData.item_name,
            quantity: inspectorAcceptData.quantity,
            unit: inspectorAcceptData.unit,
            cleaner_cleaning_items: [],
          },
        },
      },
      { new: true, upsert: true }
    );

    return customResponse.successResponse("Requests Approved", {}, res);
  } catch (error: any) {
    // Handle any unexpected errors
    Logger.error("Error approving cleaning items:", error);
    return customResponse.serverErrorResponse(
      "An unexpected error occurred in the approve cleaning endpoint",
      res,
      error
    );
  }
};

const rejectRequestedCleaningItem = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { inspectorAcceptData } = req.body;
    const { taskId } = req.query;
    // get the request_id and set it to false
    const request = await RequestCleaningItems.findOne({ task_id: taskId });
    if (!request)
      return customResponse.badRequestResponse(
        "The task does not have a request",
        res
      );

    const updateToReject = request.requested_items.find(
      (item) => item._id.toString() == inspectorAcceptData.request_id
    );

    if (!updateToReject)
      return customResponse.badRequestResponse(
        "No such request id exists",
        res
      );

    updateToReject.approved = false;
    updateToReject.inspector_reason = inspectorAcceptData.inspector_comment;
    updateToReject.completed = true;

    await request.save();
    return customResponse.successResponse("Rejected", {}, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the request requested cleaning item endpoint",
      res,
      error
    );
  }
};

// get all cleaning items used for the task
const allCleaningItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.query;
    if (!taskId)
      return customResponse.badRequestResponse("Task Id is required", res);

    const allItems = await RoomCleaningItems.findOne({ task_id: taskId });
    if (!allItems)
      return customResponse.badRequestResponse(
        "This task Id has no cleaning item",
        res
      );

    // Object to store sum of quantities and units for each cleaning_id
    const quantities: { [key: string]: number } = {};

    // Sum quantities for each cleaning_id
    for (const item of allItems.cleaning_items) {
      const cleaningItems = await CleaningItems.findById(item.cleaning_id);
      if (cleaningItems && cleaningItems.type == "tool") {
        const cleaningIdString = item.cleaning_id.toString();
        if (quantities[cleaningIdString]) {
          quantities[cleaningIdString] += +item.quantity;
        } else {
          quantities[cleaningIdString] = +item.quantity;
        }
      }
    }

    const result = Object.keys(quantities).map((key) => ({
      cleaning_id: new mongoose.Types.ObjectId(key),
      item_name:
        allItems.cleaning_items.find(
          (item) => item.cleaning_id.toString() === key
        )?.item_name || "",
      quantity: quantities[key],
      unit:
        allItems.cleaning_items.find(
          (item) => item.cleaning_id.toString() === key
        )?.unit || "",
    }));
    return customResponse.successResponse(
      "All cleaning items used",
      result,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get all cleaning items used endpoint",
      res,
      error
    );
  }
};

const closeWorkOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // cleaningItemsData: [{cleaning_id: "", "quantity": "", "damaged": "", "damaged_quantity": "", }]
    const { cleaningItemsData } = req.body;
    const updatePromises = cleaningItemsData.map(
      async (item: {
        damaged: any;
        quantity: number;
        damaged_quantity: number;
        cleaning_id: any;
      }) => {
        const finalQuantity = item.damaged
          ? item.quantity - item.damaged_quantity
          : item.quantity;
        const inventory = await CleaningItems.findById(item.cleaning_id);

        if (!inventory) {
          throw new Error("There is no cleaning item with that id");
        }

        // Update the quantity
        const newQuantity = (inventory.quantity as number) + finalQuantity;
        inventory.quantity = newQuantity;
        await inventory.save(); // Wait for the save operation to complete
      }
    );

    // Await all update promises to complete
    await Promise.all(updatePromises);
    return customResponse.successResponse(
      "Inventory updated and work order closed",
      {},
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the close work order endpoint",
      res,
      error
    );
  }
};

const inspectorTaskSummary = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const inspectorId = req.auth.userId;
    const tasks = await TaskModel.find({
      assigned_inspector: inspectorId,
    })
      .populate("planned_time assigned_room")
      .populate({
        path: "assigned_cleaner assigned_inspector",
        model: "User",
      });
    const actualTime = await Promise.all(
      tasks.map(async (task) => {
        const getTime = await ActualTime.findOne({ task_id: task._id });
        return getTime;
      })
    );
    if (!actualTime) return;
    const data = { tasks, actualTime };
    return customResponse.successResponse(
      "task summary for inspector",
      data,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get inspector task summary",
      res,
      error
    );
  }
};

const inspectorFacility = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // get the facility assigned to the inspector
    const userId = req.auth.userId; //remember to check/change for user with multiple role
    if (!userId)
      return customResponse.badRequestResponse("The userId is needed", res);

    // get current day date.
    const today = new Date(); // Current date and time
    today.setHours(0, 0, 0, 0);
    // using the userId get the facility assigned
    const inspectorFacilities = await FacilityWorkOrderModel.find({
      assigned_supervisors: { $in: userId },
      scheduled_date: today,
      completed: false,
      // assigned_rooms: { $ne: [] }, commenting out because the inspector needs to see facilities without rooms
    })
      .sort({ _id: -1 })
      .populate("facility_id assigned_rooms");

    if (!inspectorFacilities)
      return customResponse.successResponse("No tasks", {}, res);

    return customResponse.successResponse(
      "inspector facility fetched",
      inspectorFacilities,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get inspector facility endpoint",
      res,
      error
    );
  }
};

const facilityStages = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { work_order_id } = req.query;
      if (!work_order_id) return customResponse.badRequestResponse("The work order id is required",res);
  
      // Find the facility work order by ID
      const facilityWorkOrder = await FacilityWorkOrderModel.findById(work_order_id).exec();
  
      if (!facilityWorkOrder) return customResponse.badRequestResponse("Facility Work Order not found",res);
      
  
      const stagesWithStatus = await Promise.all(facilityWorkOrder.stages.map(async (stage, index) => {
          // Find corresponding stage in facility timer
          const facilityTimer = await FacilityTimerModel.findOne({
            work_order_facility: work_order_id,
            "stages.name": stage.name,
          }).exec();
  
          if (!facilityTimer) {
            return {
              name: stage.name,
              status: "pending",
              planned_start_time: facilityWorkOrder.stages[index].start_time, 
              scheduled_date: facilityWorkOrder.scheduled_date,
              actual_stage_start_time: null,
              actual_stage_stop_time: null,
            };
          }
  
          // Find matched stage
          const matchedStage = facilityTimer.stages.find(
            (timerStage) => timerStage.name === stage.name
          );
  
          if (!matchedStage) {
            return {
              name: stage.name,
              status: "pending",
              planned_start_time: facilityWorkOrder.stages[index].start_time,
              actual_stage_start_time: null,
              actual_stage_stop_time: null,
            };
          }
  
          // Determine status
          const status = matchedStage.actual_stage_stop_time
            ? "completed"
            : "pending";
  
          return {
            name: stage.name,
            status,
            planned_start_time: facilityWorkOrder.stages[index].start_time,
            actual_stage_start_time: matchedStage.actual_stage_start_time,
            actual_stage_stop_time: matchedStage.actual_stage_stop_time,
            _id: matchedStage._id
          };
        })
      );
  
      return customResponse.successResponse("stages", stagesWithStatus, res);
    } catch (error: any) {
      Logger.error(error);
      return customResponse.serverErrorResponse(
        "An error occurred in the get facility stages for inspector",
        res,
        error
      );
    }
  };
  ;

const facilityActualStartTimer = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { work_order_id } = req.query;
    const { stage_name } = req.body;
    const supervisorId = req.auth.userId;
    let result;

    if (!supervisorId)
      return customResponse.badRequestResponse("The user id is required", res);
    if (!work_order_id)
      return customResponse.badRequestResponse(
        "The facility work order is required",
        res
      );

    // based on the work_order_id and the stage_name check if a time has been started
    const existingTime = await FacilityTimerModel.findOne({
      work_order_facility: work_order_id,
      "stages.name": stage_name,
      "stages.actual_stage_start_time": { $ne: null },
    });
    if (existingTime)
      return customResponse.badRequestResponse(
        "Start time for this stage has been set by a co supervisor",
        res
      );

    // {"name": "clean"}
    const timeZone = "Africa/Lagos";
    const currentTime = new Date();
    const countryTime = new Date(
      currentTime.toLocaleString("en-US", { timeZone: timeZone })
    );

    const formattedStages = {
      name: stage_name,
      actual_stage_start_time: countryTime,
      started_by: supervisorId,
    };
    // for that work order, update the actual start time

    // if the inspector that is adding actual time stage for the work order has added before, do not create a new one. instead push to the stages
    const existingTimer = await FacilityTimerModel.findOne({
      work_order_facility: work_order_id,
    });
    if (existingTimer) {
      // push to stages
      (existingTimer.stages as any).push(formattedStages);
      result = await existingTimer.save();
    } else {
      result = await FacilityTimerModel.create({
        work_order_facility: work_order_id,
        stages: formattedStages,
      });
    }
    return customResponse.successResponse("added", result, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the get add actual start time for inspector",
      res,
      error
    );
  }
};

const facilityActualStopTimer = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { work_order_id, start_stage_id } = req.query;
    const { stage_name } = req.body;
    const supervisorId = req.auth.userId;

    const timeZone = "Africa/Lagos";
    const currentTime = new Date();
    const countryTime = new Date(
      currentTime.toLocaleString("en-US", { timeZone: timeZone })
    );

    // if the stop time is not null, do not allow them to update it!

    const existingTime = await FacilityTimerModel.findOne({
      work_order_facility: work_order_id,
      "stages.name": stage_name,
      "stages.actual_stage_stop_time": { $ne: null }, // Check if actual_stage_stop_time is not null
    });

    if (existingTime) {
      return customResponse.badRequestResponse(
        "Stop time for this stage has already been set by another inspector",
        res
      );
    }

    // update the FacilityTimer Model based on the work_order_id and the stage_id
    const exisitingTimer = await FacilityTimerModel.findOne({
      work_order_facility: work_order_id,
      "stages._id": start_stage_id,
    });
    if (!exisitingTimer)
      return customResponse.badRequestResponse(
        "You have not set the start time for this stage!",
        res
      );

    // Find the index of the stage within the stages array
    const stageIndex = exisitingTimer.stages.findIndex(
      (stage) => stage._id.toString() === start_stage_id
    );

    if (stageIndex === -1) {
      return customResponse.badRequestResponse(
        "No stage found with the provided stage_id",
        res
      );
    }
    // Update the actual_stage_stop_time for the stage
    exisitingTimer.stages[stageIndex].actual_stage_stop_time = new Date(
      countryTime
    ) as unknown as mongoose.Schema.Types.Date;
    exisitingTimer.stages[stageIndex].stoped_by = supervisorId;
    const update = await exisitingTimer.save();

    return customResponse.successResponse("updated", update, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the update facility stop timer for inspector",
      res,
      error
    );
  }
};

const stageCleaningNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { work_order_id, stage_id } = req.query;
    const { note } = req.body;

    // update the stage_id against FacilityWorkOrderModel
    const updateNote = await FacilityWorkOrderModel.updateOne(
      { _id: work_order_id, "stages._id": stage_id },
      { $push: { "stages.$.note": note } }
    );
    return customResponse.successResponse("note updated", updateNote, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the add note for stage for inspector",
      res,
      error
    );
  }
};

const releaseFacility = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { work_order_id } = req.query;
    const inspectorId = req.auth.userId;
    if (!work_order_id)
      return customResponse.badRequestResponse(
        "The facility work order id is required",
        res
      );

    // check if the stage array in the facility work order is the same with the stage array in the facility timer
    const facilityWorkOrderStage = await FacilityWorkOrderModel.findById(
      work_order_id
    );
    if (!facilityWorkOrderStage)
      return customResponse.badRequestResponse(
        "Facility work order does not exist",
        res
      );
    const facilityWorkOrderStageLength = facilityWorkOrderStage?.stages.length;

    const facilityTimerStage = await FacilityTimerModel.findOne({
      work_order_facility: work_order_id,
    });
    if (!facilityTimerStage)
      return customResponse.badRequestResponse(
        "Time has not been set for the facility work order ",
        res
      );
    const facilityTimerStageLength = facilityTimerStage.stages.length;

    if (facilityWorkOrderStageLength !== facilityTimerStageLength)
      return customResponse.badRequestResponse(
        "You must start and stop the timer for all stages",
        res
      );

    // check if the actual_stage_start_time and actual_stage_stop_time for all stages are null
    const nullCheck = await FacilityTimerModel.findOne({
      work_order_facility: work_order_id,
      "stages.actual_stage_start_time": null,
      "stages.actual_stage_stop_time": null,
    });

    // Logger.info(nullCheck);
    if (nullCheck)
      return customResponse.badRequestResponse(
        "You must start and stop all stage timer to release a facility",
        res
      );

    const update = await FacilityWorkOrderModel.findByIdAndUpdate(
      work_order_id,
      { $set: { completed: true } },
      { new: true }
    );
    return customResponse.successResponse("Facility release", update, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the release facility for inspector",
      res,
      error
    );
  }
};

const addInspectorEvidence = async (req: AuthenticatedRequest, res: Response) => {
  try {
      const { task_id, general_note, evidence_details, general_evidence } = req.body;
      const inspectorId = req.auth.userId;
      if (!inspectorId) return customResponse.badRequestResponse('The inspector Id is required', res);
      if (!task_id) return customResponse.badRequestResponse('The task Id is required', res);

      const taskIdCheck = await TaskModel.findById(task_id);
      if (!taskIdCheck) return customResponse.badRequestResponse('Wrong task Id', res);

      // Check if the evidence_details.detail_id matches the taskId passed
      const evidenceDetailCheck = await Promise.all(evidence_details.map(async (detailData: any) => {
          const check = await TaskModel.find({ _id: task_id, "tasks.roomDetailId": detailData.detail_id });
          return { detail_id: detailData.detail_id, found: check.length > 0 };
      }));

      const incorrectEvidenceId = evidenceDetailCheck.filter((check) => !check.found).map((check) => check.detail_id);

      if (incorrectEvidenceId.length > 0) {
          const errorMessage = `The following detail_ids do not belong to the taskId passed: ${incorrectEvidenceId}`;
          return customResponse.badRequestResponse(`${errorMessage}`, res);
      }

      // Check if the inspector has uploaded evidence for the particular task. If yes, update; else, create a new one
      let existingEvidence = await InspectorEvidence.findOne({ task_id: task_id, inspector_id: inspectorId });
      if (existingEvidence) {
          existingEvidence.general_note.push(general_note);
          existingEvidence.general_evidence.push(...general_evidence);

          for (const newDetail of evidence_details) {
              const existingDetailIndex = existingEvidence.evidence_details.findIndex(detail => detail.detail_id.toString() === newDetail.detail_id);
              if (existingDetailIndex !== -1) {
                  // Update existing detail
                  existingEvidence.evidence_details[existingDetailIndex].image_path.push(...newDetail.image_path);
                  existingEvidence.evidence_details[existingDetailIndex].note.push(newDetail.note);
              } else {
                  // Create a new entry for detail_id if not found
                  existingEvidence.evidence_details.push({
                      detail_id: newDetail.detail_id,
                      image_path: newDetail.image_path,
                      note: newDetail.note
                  });
              }
          }

          await existingEvidence.save();
      } else {
          // Create a new entry if no evidence exists for the task
          existingEvidence = await InspectorEvidence.create({
              task_id: task_id,
              inspector_id: inspectorId,
              general_note: general_note,
              general_evidence: general_evidence,
              evidence_details: evidence_details.map((evidence: { detail_id: any; image_path: String[]; note: String; }) => ({
                  detail_id: evidence.detail_id,
                  image_path: evidence.image_path,
                  note: evidence.note
              }))
          });
      }
      return customResponse.successResponse('Uploaded', {}, res);
  } catch (error: any) {
      Logger.error(error);
      return customResponse.serverErrorResponse(
          "An error occurred when creating an Inspector evidence",
          res,
          error
      );
  }
};


export default {
  activeTasks,
  allFacilitiesCleaned,
  getRoomLocation,
  getInspectorRoom,
  getRoomTask,
  updateTaskItem,
  getAllCleaningItemsRequest,
  getSingleCleaningItemRequest,
  getRequestDetail,
  approveCleaningItems,
  inspectorTaskSummary,
  allCleaningItems,
  closeWorkOrder,
  rejectRequestedCleaningItem,
  inspectorFacility,
  facilityStages,
  facilityActualStartTimer,
  facilityActualStopTimer,
  stageCleaningNote,
  releaseFacility,
  addInspectorEvidence,
};
