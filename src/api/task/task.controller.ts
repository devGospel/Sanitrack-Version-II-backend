import { Request, Response } from "express";
import TaskModel from "../../models/task";
import customResponse from "../../helpers/response";
import { AuthenticatedRequest } from "../../middlewares/security";
import RoomService from "../../services/room";
import TaskService from "../../services/task";
import User from "../../models/user";
import Timer from "../../models/timer";
import Location from "../../models/location";
import RoomModel from "../../models/room";
import {cleaningData} from "../../types/interface";
import { createChildLogger } from "../../utils/childLogger";

const moduleName = "[task/controller]";
const Logger = createChildLogger(moduleName);
//Notification management

import notificationController from "../notifications/notification.controller";
import PlannedTime from "../../models/plannedTime";
import RoomCleaningItems from "../../models/roomCleaningItems";
import CleaningItems from "../../models/cleaningItems";
import mongoose from "mongoose";
import ActualTime from "../../models/actualTime";
import { sortTaskByResassignment } from "../../sorting/sortByTaskRequiringResassignment";
import validateCleaningTask from "../../validator/validAddTasking";
import staffStartTimeModel from "../../models/cleanerStartTime";
import { removeTime } from "../../utils/date";
import RoomDetailModel from "../../models/roomDetail";
import FacilityWorkOrderModel from "../../models/workFacility";
import InspectorEvidence from "../../models/inspectorEvidence";
import { isOverDue } from "../../utils/passDue";
import RequestCleaningItems from "../../models/cleaningItemsRequest";

/**
 * Create a new task with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */

const createTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // {
      // facilityWorkOrder: "65fe9e35ec2f25a79060d8ac",
      // facility_id: "3454354654"
      //   "inspectors": ["sdfsdf", "Sdfsdf"},
      //   "roomId": "77777",
      //   "cleaners": ["65e44c5c0872137740de2340"], //bella
      //   "locationId": "65e234a8e36cdf0838aff342", "cleaningData": [
      //     {
      //         "cleaning_id": "65e1b0f302959942bfc60b9d",
      //         "item_name": "Mop",
      //         "quantity": 1, 
      //         "unit": "number"
      //     }
      // ], 
      // "itemsToClean": [ //particular room has 4 items but they are selecting only 2 to be cleaned
      //     {"roomDetailId": "65e44d630872137740de25ad", "name": "Fridge"},
      //     {"roomDetailId": "65e44d630872137740de25ae", "name": "Shelf"}
      //     // {"roomDetailId": "65e44d630872137740de25af", "name": "Mirror"}
      // ]
    // }
   const {inspectors, locationId, cleaners, cleaningData, itemsToClean, roomId, scheduled_date, clean_hours, clean_minutes, preop_hours, preop_minutes, facilityWorkOrderId} = req.body
   const dateAdded = new Date().toISOString().substring(0, 10)
   const current_date = scheduled_date ? new Date(scheduled_date) :  new Date()
   const cleaning_expiry_time = new Date(current_date.getTime() + 12 * 60 * 60 * 1000)

   const assigned_inspectors = inspectors
   const assigned_cleaner = cleaners
   const assigned_manager = req.auth.userId
   const assigned_location = locationId
   const checkTask = false

   let plannedTime
   const result = await validateCleaningTask(cleaningData, checkTask, roomId, assigned_location, assigned_cleaner, assigned_inspectors, scheduled_date)
   if (result !== "") return customResponse.badRequestResponse(result, res);

   if(clean_hours && clean_minutes && preop_hours && preop_minutes){ 
    const planned_cleaning = parseInt(clean_hours) * 3600 + parseInt(clean_minutes) * 60;
    const planned_preop = parseInt(preop_hours) * 3600 + parseInt(preop_minutes) * 60;
    const planned_release = planned_cleaning + planned_preop;

    plannedTime = await PlannedTime.create({
      clean_time: planned_cleaning,
      preOp_time: planned_preop,
      release_time: planned_release,
    });
   }
   

   const task = await TaskModel.create({
    assigned_inspector: assigned_inspectors, 
    assigned_manager: assigned_manager, 
    assigned_cleaner: assigned_cleaner, 
    assigned_location: assigned_location, 
    assigned_room: roomId, 
    planned_time: plannedTime ? plannedTime._id : null,
    work_order_facility: facilityWorkOrderId ? facilityWorkOrderId : null, 
    date_added: dateAdded, 
    scheduled_date: scheduled_date ? scheduled_date : null, 
    tasks: itemsToClean.map((item: { roomDetailId: any; name: String }) => ({
      name: item.name,
      roomDetailId: item.roomDetailId,
      cleaning_expiry_time: cleaning_expiry_time
  })),
   })
   
     // // // Create cleaning details record
     const cleaningDetails = await RoomCleaningItems.create({
      task_id: task._id,
      room_id: roomId,
      cleaning_items: cleaningData,
  });

  // using the faciltity work order passed, push the room Id
  await FacilityWorkOrderModel.findByIdAndUpdate(facilityWorkOrderId, {$push: {"assigned_rooms": roomId}})
  
  return customResponse.createResponse("Task created successfully",task,res);

  } catch (err: any) {
    Logger.error(err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the create task endpoint",
      res,
      err
    );
  }
};

/**
 * Submit task with its completed details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
// this is for the cleaner actually
const submitTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // const role = req.auth.role_id.role_name;
    // receive the start_time, stop_time and room_id
    const taskId = req.query.taskId;
    const cleanerId = req.auth.userId;
    const { cleanTime, roomId } = req.body;

    if (!taskId)
      return customResponse.badRequestResponse(
        "Missing required query param <taskId>",
        res
      );

    // update the timer
    // const updateTime = await Timer.create({
    //   taskId: taskId,
    //   roomId: roomId,
    //   start_time: start_time,
    //   stop_time: stop_time,
    // });

    // update the actualTimer for this task
    // check if the clean_time for that particular task == 0
    const cleanTimeCheck = await ActualTime.findOne({
      task_id: taskId,
      "clean_time.cleaner_id": cleanerId,
    });

    if (cleanTimeCheck) {
      cleanTimeCheck.clean_time.time.push(cleanTime);
      await cleanTimeCheck.save();
    } else {
      await ActualTime.create({
        task_id: taskId,
        room_id: roomId,
        clean_time: { cleaner_id: cleanerId, time: cleanTime },
      });
    }

    // after sucessful save, update the task_stage to 'preop'
    const task = await TaskModel.findOne({ _id: taskId });
    if (!task)
      return customResponse.badRequestResponse(
        "There is no task with that id",
        res
      );

    task.task_stage = "preop";
    await task.save();

    // Send notification to assigned Inspector
    const assignedInspectorId = await TaskModel.findById(taskId);
    const assignedInspector = await User.findById(assignedInspectorId);
    const assignedInspectorNotificationToken =
      assignedInspector?.notificationToken;
    if (assignedInspectorNotificationToken !== undefined) {
      notificationController.sendNotification(
        assignedInspectorNotificationToken,
        "Task Submission",
        "A new task has been submitted. Click here to review."
      );
    }
    return customResponse.successResponse("Task submitted", task, res);
  } catch (err: any) {
    console.error(err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the submit task endpoint",
      res,
      err
    );
  }
};

/**
 * Get all tasks with its completed details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const getAllTasks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const taskQuery = TaskModel.find()
      .populate({
        path: "assigned_inspector assigned_manager assigned_cleaner",
        select: "username",
      })
      .populate("assigned_room")
      .sort({ _id: -1 });

    const [totalTasks, allTasks] = await Promise.all([
      TaskModel.countDocuments(),
      taskQuery.exec(),
    ]);

    // Prepare data to send in the response
    const data = {
      totalTasks,
      allTasks: allTasks.map((task) => ({
        taskId: task._id,
        cleanerUsername: task.assigned_cleaner,
        inspectorUsername: task.assigned_inspector,
        roomName: task.assigned_room,
        isSubmitted: task.isSubmitted,
        stage: task.task_stage,
        scheduled_date: task.scheduled_date
        // Add other task details as needed
      })),
    };

    // Return success response with paginated task information
    return customResponse.successResponse(
      "Get all tasks successful",
      data,
      res
    );
  } catch (err: any) {
    console.error(err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get all task endpoint",
      res,
      err
    );
  }
};

/**
 * View task with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const getTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const taskId = req.query.taskId;

    if (!taskId) {
      return customResponse.badRequestResponse(
        "Missing required query param <taskId>",
        res
      );
    }
    // const query = {
    //     _id: taskId,
    //     ...(role === 'cleaner' && { assigned_cleaner: userId }),
    //     ...(role === 'inspector' && { assigned_inspector: userId }),
    //     ...(role === 'manager' && { assigned_manager: userId }),
    // };

    const task = await TaskModel.findOne()
      .populate(
        "assigned_inspector assigned_manager assigned_cleaner assigned_room"
      )
      .exec();

    if (!task) {
      return customResponse.badRequestResponse(
        "Task not found or not permitted to view this task",
        res
      );
    }

    // Return success response with task information
    return customResponse.successResponse(
      "Task retrieved successfully",
      task,
      res
    );
  } catch (err: any) {
    console.error(err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the get task endpoint",
      res,
      err
    );
  }
};

/**
 * Update task
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const updateTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { roomId, inspectorId, cleanerId, taskId } = req.body;

    // Validate the request body
    if (!roomId || !inspectorId || !cleanerId || !taskId) {
      return customResponse.badRequestResponse("Missing required fields", res);
    }

    // Get the task and update its details
    const task = await TaskModel.findById(taskId);
    if (!task) {
      return customResponse.badRequestResponse("Task not found", res);
    }
    // Update task
    task.assigned_inspector = inspectorId;
    task.assigned_cleaner = cleanerId;
    await task.save();

    // Send notification to the assigned cleaner and the assigned inspector
    const assignedInspector = await User.findById(inspectorId);
    const assignedCleaner = await User.findById(cleanerId);
    const cleanerNotificationToken = assignedCleaner?.notificationToken;
    const inspectorNotificationToken = assignedInspector?.notificationToken;
    if (
      inspectorNotificationToken !== undefined &&
      cleanerNotificationToken !== undefined
    ) {
      notificationController.sendNotification(
        inspectorNotificationToken,
        "Task assigned",
        "You have been assigned a new task"
      );
      notificationController.sendNotification(
        cleanerNotificationToken,
        "Task assigned",
        "You have been assigned a new task"
      );
    }
    // Send notification for web based users
    if (
      assignedCleaner?.webPushSubscription &&
      assignedInspector?.webPushSubscription
    )
      notificationController.sendWebNotification(
        cleanerId,
        "Task assigned",
        "You have been assigned a new task"
      );

    notificationController.sendWebNotification(
      inspectorId,
      "Task assigned",
      "You have been assigned a new task"
    );

    return customResponse.createResponse(
      "Task updated successfully",
      task,
      res
    );
  } catch (err: any) {
    console.error(err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the update task endpoint",
      res,
      err
    );
  }
};

/**
 * Delete task
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { taskId } = req.body;
    // Validate the request body
    if (!taskId) {
      return customResponse.badRequestResponse("Missing required field", res);
    }

    // Get the task and update its details
    const task = await TaskModel.findByIdAndDelete(taskId);
    const plannedTime = await PlannedTime.findByIdAndDelete(taskId);
    return customResponse.createResponse(
      "Task deleted successfully",
      task,
      res
    );
  } catch (err: any) {
    console.error(err);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the delete task endpoint",
      res,
      err
    );
  }
};

const getTaskThatNeedsReassignment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { start_date, end_date } = req.body;
  const data = await sortTaskByResassignment(start_date, end_date);
  if (data.data?.length === 0)
    return customResponse.successResponse(
      "No task needs reassignment",
      data.data,
      res
    );
  return customResponse.successResponse(
    "Task that needs reassignment is gotten",
    data.data,
    res
  );
};

const saveStartTime = async (req: AuthenticatedRequest, res: Response) => {
  // try {
  //   const taskId = req.query.taskId;
  //   const { roomId } = req.body;
  //   const currentTime = new Date().toLocaleString("en-US", {
  //     timeZone: "America/New_York",
  //   }); // Get current time in USA Eastern Time
  //   const staffId = req.auth.userId;
  //   const staffRole =
  //     req.auth.role_name == undefined
  //       ? req.auth.role_id.role_name
  //       : req.auth.role_name;

  //   // Logger.info(staffRole);
  //   const taskCheck = await TaskModel.findOne({ _id: taskId });
  //   if (!taskCheck)
  //     return customResponse.badRequestResponse(
  //       "There is no task with that id",
  //       res
  //     );
  //   // check the cleanerStartTime to know if the staff has entered a time before for the specific task
  //   const check = await staffStartTimeModel.findOne({
  //     task_id: taskId,
  //     "main_time.staff_id": staffId,
  //     staff_role: staffRole,
  //   });
  //   if (!check) {
  //     //it means that the cleaner has not entered a time before
  //     await staffStartTimeModel.create({
  //       task_id: taskId,
  //       room_id: roomId,
  //       staff_role: staffRole,
  //       main_time: { staff_id: staffId, start_time: currentTime },
  //     });
  //   } else {
  //     // for that specific taskId and cleanerId, push the start_time to the main_time
  //     check.main_time.start_time.push(currentTime);
  //     await check.save();
  //   }

  //   return customResponse.successResponse("time saved", check, res);
  // } catch (error: any) {
  //   Logger.error(error);
  //   return customResponse.serverErrorResponse(
  //     "An error occurred in the save start time endpoint",
  //     res,
  //     error
  //   );
  // }
};

const getPlannedTime = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.query.taskId;
    const plannedTime = await TaskModel.findById(taskId).populate(
      "planned_time"
    );

    return customResponse.successResponse(
      "planned time fetched",
      plannedTime?.planned_time,
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the planned time",
      res,
      error
    );
  }
};

const taskSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.query.taskId;
    if (!taskId) return customResponse.badRequestResponse("A task Id is needed", res);

    const taskDetails = await TaskModel.findById(taskId)
      .populate("planned_time")
      .populate({
        path: "assigned_cleaner assigned_inspector",
        model: "User",
      });

      if(!taskDetails){ 
        return customResponse.badRequestResponse('Wrong task Id passed', res)
      }
    const allCleaningItems = await RoomCleaningItems.findOne({
      task_id: taskId,
    });

    const cleaningItems: {
      cleaning_id: mongoose.Types.ObjectId;
      item_name: String;
      quantity: Number;
      unit: String;
      cleaner_cleaning_items: [
        { cleaner_id: mongoose.Types.ObjectId; quantity_assigned: Number }
      ];
    }[] = [];

    const quantitiesPerCleaningId: { [key: string]: number } = {};

    if (allCleaningItems) {
      allCleaningItems.cleaning_items.forEach((item) => {
        const cleaningId = item.cleaning_id.toString();
        if (quantitiesPerCleaningId[cleaningId] === undefined) {
          quantitiesPerCleaningId[cleaningId] = item.quantity as number;
          cleaningItems.push(item);
        } else {
          quantitiesPerCleaningId[cleaningId] += item.quantity as number;
          const foundIndex = cleaningItems.findIndex(
            (presentItem) => presentItem.cleaning_id.toString() === cleaningId
          );
          if (foundIndex !== -1) {
            cleaningItems[foundIndex].quantity =
              quantitiesPerCleaningId[cleaningId];
          }
        }
      });
    }

    const inspectorEvidence = await InspectorEvidence.findOne({task_id: taskId})
    // Logger.info(JSON.stringify(rearrangedItems))
    const result = { taskDetails, cleaningItems, inspectorEvidence };
    return customResponse.successResponse("fetched", result, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred in the task summary endpoint",
      res,
      error
    );
  }
};

const activeTimer = async (req: AuthenticatedRequest, res: Response) => {
  // try {
  //   const staffId = req.auth.userId;
  //   const role = req.auth.role_name || req.auth.role_id.role_name;

  //   // I am supposed to get the main_time.start_time where the staff_id matches the cleanerId and the taskId matches the TaskModel and the task stage is 'clean'
  //   const result = await staffStartTimeModel.find({
  //     "main_time.staff_id": staffId,
  //     staff_role: role,
  //   });
  //   // based on the result gotten, check against the TaskModel and only return the one that is 'clean'
  //   const finalResult = [];
  //   // Iterate over each staff start time
  //   for (const staffStartTime of result) {
  //     // Find the corresponding task using task_id
  //     const task = await TaskModel.findById(staffStartTime.task_id);

  //     // Check if task exists and its stage is 'clean'
  //     if (task && task.task_stage === "clean") {
  //       // If so, push the staff start time to the final result
  //       finalResult.push(staffStartTime);
  //     }
  //   }
  //   // Return the filtered staff start times
  //   return customResponse.successResponse(
  //     "active tasks timer for cleaner",
  //     finalResult,
  //     res
  //   );
  // } catch (error: any) {
  //   Logger.error(error);
  //   return customResponse.serverErrorResponse(
  //     "An error occurred in the active timer endpoint",
  //     res,
  //     error
  //   );
  // }
};

const mss = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // get the data (roomName, item, frequency, last_cleaned, next_due, past_due, assigned_to, item status, workOrderId - get it from the date_added and append daily in front, evidence link)
    const taskData = await TaskModel.find().sort({_id: -1}).populate("assigned_room");
    taskData.forEach(task => { 
      task.tasks.forEach(singleTask => { 
        singleTask.isOverDue =  isOverDue(singleTask.cleaning_expiry_time, singleTask.last_cleaned)
      })
    })
    return customResponse.successResponse("mss data fetched", taskData, res)
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred when getting the tabular data for mss",
      res,
      error
    );
  }
};

// const mssModified = async(req:AuthenticatedRequest, res:Response) =>{ 
//   try {
//     const tasks = await TaskModel.find().populate('assigned_room')
//     const allDetails = await RoomDetailModel.find()
//     const flattedDetail = allDetails.flatMap(item => item.detail)

//     // Logger.info(flattedDetail.length)

//     // details to be returned roomName, itemName, frequency, last_cleaned, next due, past due, assigned_to, itemStatus, work_orderId, evidence_link, 
//     const mostCurrentTask = await Promise.all(flattedDetail.map(async (detail) => { 
//       const tasksForDetail = tasks.filter(task => task.tasks.some(taskDetail => taskDetail.roomDetailId.toString() === detail._id?.toString()));

//       // Logger.info(`task for the detail id are => ${tasksForDetail}`)
//       if (tasksForDetail.length > 0) { 
//           tasksForDetail.sort((a, b) => {
//               const bDate = b.scheduled_date ? new Date(b.scheduled_date as unknown as Date) : new Date(b.date_added as unknown as Date);
//               const aDate = a.scheduled_date ? new Date(a.scheduled_date as unknown as Date) : new Date(a.date_added as unknown as Date);
//               return bDate.getTime() - aDate.getTime();
//           });

          
//           const mostRecentTask = tasksForDetail[0];
//           // Logger.info(`after sorting, most recent is => ${mostRecentTask}`)

//           mostRecentTask.tasks = mostRecentTask.tasks.filter(task => task.roomDetailId.toString() === detail._id?.toString()) as typeof mostRecentTask.tasks;

//           if (mostRecentTask != null) { 
//               const mostRecentTaskExpiry = mostRecentTask.tasks[0].cleaning_expiry_time;
//               const mostRecentLastCleaned = mostRecentTask.tasks[0].last_cleaned;
//               mostRecentTask.tasks[0].isOverDue =  isOverDue(mostRecentTaskExpiry, mostRecentLastCleaned);
//               // Logger.info(`${detail._id}, _id => ${mostRecentTask._id} expiry => ${mostRecentTaskExpiry}, last_cleaned => ${mostRecentLastCleaned}, overDue => ${mostRecentTask.tasks[0].isOverDue}`)
//           }

          
          
//           const inspectorEvidence = await InspectorEvidence.findOne({task_id: mostRecentTask._id});
          
//           if(inspectorEvidence){ 
//             inspectorEvidence.evidence_details = inspectorEvidence.evidence_details.filter(evidence => evidence.detail_id.toString() === detail._id?.toString()) as typeof inspectorEvidence.evidence_details
//           }
//           return {
//               detailId: detail._id,
//               mostRecentTask: mostRecentTask || 'Task has not been created for this item ', 
//               inspectorEvidence: inspectorEvidence || 'No evidence has been uploaded by the inspectors'
//           };
//       } else { 
//           return { 
//               detailId: detail._id,
//               mostRecentTask: 'Task has not been created for this item', 
//               inspectorEvidence: 'No evidence has been uploaded by the inspectors'
//           };
//       }
//   }));
//     // Logger.info(JSON.stringify(mostCurrentTask))
//     return customResponse.successResponse('fetched', mostCurrentTask, res)
//   } catch (error:any) {
//     Logger.error(error)
//     return customResponse.serverErrorResponse(
//       "An error occurred when getting the modified  data for mss",
//       res,
//       error
//     );
    
//   }
// }

const cleaningPerformance = async(req: AuthenticatedRequest, res: Response) => {
  try{
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // Returns a zero-based index (0 for January, 1 for February, etc.)

    // get the tasks scheduled for the current month and get the one that has been cleaned and not cleaned
    const result = await TaskModel.aggregate([
      {
          $unwind: "$tasks"
      },
      {
          $project: { 
              month: { $month: "$scheduled_date" },
              isDone: "$tasks.isDone"
          }
      },
      {
          $match: {
            $and: [
              { month: {$ne: null }},
              {month: currentMonth }
               
            ]
              
          }
      },
      {
          $group: {
              _id: {
                  month: "$month",
                  isDone: "$isDone"
              },
              count: { $sum: 1 } // Count the occurrences of each combination
          }
      },
      {
          $group: {
              _id: "$_id.month",
              counts: {
                  $push: {
                      isDone: "$_id.isDone",
                      count: "$count"
                  }
              }
          }
      }
  ]);
  
  // Now, result will contain an array of objects where each object represents a month
  // and contains counts for tasks with isDone true and false
  
    return customResponse.successResponse('overall cleaning fetched for current month', result, res)
  }catch (error: any){ 
    Logger.error(error)
    return customResponse.serverErrorResponse("An error occurred when getting the overall cleaning data for the day", res, error)
  }
}
const missedMonthlyCleaning = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const result = await TaskModel.aggregate([
      {
        $unwind: "$tasks", // Deconstruct the tasks array
      },
      {
        $project: {
          month: { $month: "$date_added" },
          isDone: "$tasks.isDone",
        },
      },
      {
        $group: {
          _id: { month: "$month", isDone: "$isDone" },
          missed_cleanings: {
            $sum: {
              $cond: { if: { $eq: ["$isDone", false] }, then: 1, else: 0 },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          missed_cleanings: {
            $sum: "$missed_cleanings",
          },
        },
      },
    ]);
    return customResponse.successResponse("example", result, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occurred when getting the missed monthly cleaning",
      res,
      error
    );
  }
};

const getTopMissedItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentMonth = new Date().getMonth() + 1; // Get current month (1-indexed)
    const result = await TaskModel.aggregate([
      // Match tasks for the current month
      {
        $match: {
          'scheduled_date': { $gte: new Date(new Date().getFullYear(), currentMonth - 1, 1), $lt: new Date(new Date().getFullYear(), currentMonth, 1) }
        }
      },
      // Unwind tasks array to denormalize
      { $unwind: '$tasks' },
     
      // Match tasks that are not done
      { $match: { 'tasks.isDone': false } },
      // Group by detail name and count the occurrences
      {
        $group: {
          _id: '$tasks.roomDetailId',
          count: { $sum: 1 }
        }
      },
      // Sort by count in descending order
      { $sort: { count: -1 } },
      // Limit to top 3 missed items
      { $limit: 5 }, 
      
    ])
  
    const resultWithItemNames = await Promise.all(result.map(async (item) => {
      // Logger.info(JSON.stringify(item._id))
      const roomDetail = await RoomDetailModel.findOne({"detail._id": item._id}, {"detail.$": 1})
      // Logger.info(roomDetail?.detail)
      // If roomDetail is found, map the corresponding item names
      if (roomDetail) {
        return {
          _id: item._id,
          count: item.count,
          // itemNames: roomDetail.detail[0].name
        };
      } else {
        // If roomDetail is not found, return null or handle the case accordingly
        return null;
      }
    }));
    return customResponse.successResponse("example", resultWithItemNames, res);
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "An error occured when getting the monthly most frequently missed item",
      res,
      error
    );
  }
};

const scanRoomCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth.userId;
    const roomId = req.query.roomId; 

    
    const role = req.auth.role_id && req.auth.role_id.role_name ? req.auth.role_id.role_name : req.auth.role_name;
    // Logger.info(role);

    let dailyTask;

    if (role === 'Inspector') {
      dailyTask = await TaskModel.find({ assigned_inspector: {$in: userId}, assigned_room: roomId,  isSubmitted: false }).populate('assigned_location assigned_room').sort({ _id: -1 });
    } else if (role === 'Cleaner') {
      dailyTask = await TaskModel.find({ assigned_cleaner: {$in: userId}, assigned_room: roomId, isSubmitted: false }).populate('assigned_location assigned_room').sort({ _id: -1 });
    }else{ 
      return customResponse.successResponse('There is nothing to show for your role', {},res)
    }

    if (!dailyTask) {
      return customResponse.successResponse('No task for today', {}, res);
    }

    return customResponse.successResponse('Task fetched', dailyTask, res);
  } catch (error: any) {
    Logger.error('Error in scanRoomCode:', error);
    return customResponse.serverErrorResponse('Internal server error', res, error);
  }
};

const getAllCleaningItemsRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Fetch all requested cleaning items
    const allRequestedItems = await RequestCleaningItems.find();
    
    if (!allRequestedItems || allRequestedItems.length === 0) {
      return customResponse.successResponse('No request', {}, res);
    }

    // Process each requested cleaning item
    const processedRequests = await Promise.all(allRequestedItems.map(async (request) => {
      try {
        const task = await TaskModel.findById(request.task_id).populate('assigned_room');
        
        const cleaningItemFilter = request.requested_items.filter(item => !item.completed);

        if (!task) {
          return {
            task: "No task",
            cleaningItem: cleaningItemFilter
          };
        }

        if (cleaningItemFilter.length === 0) {
          return null; // Omit tasks with no pending cleaning items
        }
        return { task, cleaningItemFilter };
      } catch (error) {
        Logger.error(`Error processing request: ${error}`);
        return null;
      }
    }));

    // Filter out null values and send response
    const filteredRequests = processedRequests.filter(Boolean);
    if (filteredRequests.length === 0) {
      return customResponse.successResponse('No pending cleaning items', {}, res);
    }
    
    return customResponse.successResponse('Requested cleaning items', filteredRequests, res);
  } catch (error: any) {
    Logger.error(`An error occurred when getting all cleaning items: ${error}`);
    return customResponse.serverErrorResponse(
      "An error occurred when getting all cleaning items",
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

const approveCleaningItems = async(req:AuthenticatedRequest, res: Response) => {
  
    // inspector entered the quantity he wants to give to them and now, for each of the item, check if the quantity entered can be assigned (check against the cleaning_items table with the cleaning_id passed)
  // if that is allowed, subtract the quantity he entered from the cleaning_items (this is the inventory)
  // then check if the cleaning_id is already in the rooms_cleaning_items table. if it is, update the quantity (old quantity + new one)
  // if it is not, insert a new one into the room_cleaning_items (this method will not work because I am letting the cleaner approve items once so if the inspector approves and sends back to them, they will not be able to see it so create a new document under the correct task_id)
  const { taskId } = req.query;
  const { inspectorAcceptData } = req.body;
  const insufficientStockItems: string[] = [];

  // inspectorData = [{"approved" : "", "cleaning_id": "", request_id: "", "inspector_comment": ", "item_name": "", "quantity": "", "unit": ""}]
  try {
    if(!taskId) return customResponse.badRequestResponse('The task id is required', res)
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
    return customResponse.successResponse('Items accepted', {}, res)
  } catch (error: any) {
    Logger.error(error)
    return customResponse.serverErrorResponse('An error occurred while approving cleaning item',res, error)
  }
}

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
// get room detail
const meh = async (req: AuthenticatedRequest, res: Response) => {
  const { roomDetailId } = req.query;
  Logger.info(roomDetailId);
  const result = await RoomDetailModel.findOne({ "detail._id": roomDetailId }, {"detail.$": 1});
  return customResponse.successResponse("Top Missed Items", result, res);
};
export default {
  missedMonthlyCleaning,
  getTopMissedItems,
  meh,
  createTask,
  submitTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  getTaskThatNeedsReassignment,
  saveStartTime,
  getPlannedTime,
  taskSummary,
  activeTimer,
  cleaningPerformance,
  mss,
  scanRoomCode, 
  // mssModified,
  getAllCleaningItemsRequest, 
  getSingleCleaningItemRequest, 
  getRequestDetail,
  approveCleaningItems,
  rejectRequestedCleaningItem
};
