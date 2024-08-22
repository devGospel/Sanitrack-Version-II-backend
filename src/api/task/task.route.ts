import { Router } from "express";
import validate from "../../middlewares/validate";
import validator from "../../validator/task";
import task from "./task.controller"
import { UserPermissions } from "../../constant/permissions";
import { permissionCheck } from "../../middlewares/security";

export default () => { 
    const taskRoutes = Router();
    const {admin, cleanerPermission} = UserPermissions
    // Route for creating task
    taskRoutes.post("/create",  permissionCheck(admin.createTask), task.createTask);

    // Route for getting all tasks
    taskRoutes.get("/get", permissionCheck(admin.getTask), task.getAllTasks);

    // Route for getting all tasks by QRCODE
    taskRoutes.get("/get-all-tasks-by-qrcode", task.getAllTasks);

    // Route for getting task by id
    taskRoutes.get("/get-single-task", permissionCheck(admin.getSingleTask), task.getTask);

    // Route for updating task
    taskRoutes.put("/update-task",  permissionCheck(admin.updateTask), validate(validator.updateTask), task.updateTask);

    // Route for submitting task
    taskRoutes.post("/submit", validate(validator.submitTask), task.submitTask);

    // Route for getting planned time of a task 
    taskRoutes.get('/planned-time', task.getPlannedTime)

    // ADD IT BACK TO THE SUBMIT ROUTE 
    // permissionCheck(cleanerPermission.submitTask),
    // Route for deleting task
    taskRoutes.delete("/delete-task",  permissionCheck(admin.deleteTask), validate(validator.deleteTask), task.deleteTask);

    taskRoutes.get('/require-subtask', task.getTaskThatNeedsReassignment)

    taskRoutes.get('/summary', task.taskSummary)

    taskRoutes.get('/cleaning-performance', task.cleaningPerformance) //get the cleaning performance for the month
    //Route to handle the mss table data they want 
    taskRoutes.get('/mss', task.mss)

    // taskRoutes.get('/mss-modified', task.mssModified)

    taskRoutes.get('/missed-cleaning', task.missedMonthlyCleaning )

    taskRoutes.get('/missed-items', task.getTopMissedItems)

    taskRoutes.get('/roomdet', task.meh)

    taskRoutes.get('/scan', task.scanRoomCode)

    taskRoutes.get('/requested-cleaning-items', task.getAllCleaningItemsRequest)
    taskRoutes.get('/cleaning-items', task.getSingleCleaningItemRequest)
    taskRoutes.get('/request-detail', task.getRequestDetail)
    taskRoutes.put('/approve-cleaning-items', task.approveCleaningItems)
    taskRoutes.put('/decline', task.rejectRequestedCleaningItem)

    return taskRoutes
}