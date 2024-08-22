import { AuthenticatedRequest } from "../../middlewares/security";
import { Response } from "express";
import customResponse from "../../helpers/response"
import TaskModel from "../../models/task";
import RoomModel from "../../models/room";

import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import { getLoggedInUserRoleName } from "../../utils/getLoggedInUserRoleName";
import { Roles } from "../../constant/roles";
import { getAllAssetsForManager } from "../../services/managerAsset";
import { getAssetsForInspector } from "../../services/inspectorCheck";
import RoomDetailModel from "../../models/roomDetail";
import WorkOrderTaskModel from "../../models/workOrderTasks";
import InspectorEvidenceModel from "../../models/inspectorEvidenceNew";
import CleanerEvidenceModel from "../../models/cleanerEvidence";
import WorkOrderModel from "../../models/workorder";

const moduleName = '[evidence/controller]'
const Logger = createChildLogger(moduleName)

const getRoomFromTask = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const role = req.auth.role_id.role_name;
      if(role !== 'Admin') {
          return customResponse.badRequestResponse('You do not have permission to get room for evidence', res);
      }
      const assigned_rooms = await TaskModel.find().populate({
        path: 'assigned_room',
        model: RoomModel, // Specify the model for population
      }).sort({date_added: -1});
  
      const data = assigned_rooms.map((details) => ({
        task_id: details._id,
        roomName: (details.assigned_room as any)?.roomName || null,
        dateAdded: details.date_added
      }));
  
      return customResponse.successResponse('Assigned rooms', data, res);
    } catch (err: any) {
      Logger.error(err);
  
      // Return server error response if an error occurs
      return customResponse.serverErrorResponse(
        'Oops... Something occurred in the get all users endpoint',
        res,
        err
      );
    }
};
  
const getImagesFromTask = async(req:AuthenticatedRequest, res:Response) => { 
    try{
      const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to view uploaded images for this room', res);
        }
        const {taskId} = req.query
        // use the taskId to populate the tasks and get their images 
        if(!taskId) return customResponse.badRequestResponse('Missing required query param <taskId>', res);
        const tasks = await TaskModel.findById(taskId).populate('tasks')
        const data = tasks?.tasks.map(images => ({
            image_url: images.image
        }))
        return customResponse.successResponse('Tasks found', data, res)
    }catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get image by task id endpoint',
            res,
            err
        );
    }
}

const getAllWorkOrder = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
  const staffId = req.auth.userId
  const {facilityId} = req.query
  const role = getLoggedInUserRoleName(req)
  let assetIds 
  if(role == Roles.MANAGER){ 
      if(!facilityId){ 
          return customResponse.badRequestResponse('The facility id required for manager and inspector', res)
      }
      const managerAssetService = await getAllAssetsForManager(staffId, facilityId as string)
      if(!managerAssetService.found){ 
          return customResponse.successResponse(managerAssetService.message, [], res)
      }
      assetIds = managerAssetService.data.map(asset => asset._id)
  }else if((role == Roles.SUPERVISOR || role == Roles.INSPECTOR)){ 
      if(!facilityId){ 
          return customResponse.badRequestResponse('The facility id required for manager and inspector', res)
      }
      const inspectorAssetService = await getAssetsForInspector(staffId, facilityId as string)
      if(!inspectorAssetService.found){ 
          return customResponse.successResponse(inspectorAssetService.message, [], res)
      }
      assetIds = inspectorAssetService.data.map(asset => asset._id)
  }else{ 
      const allAssets = await RoomDetailModel.find()
      assetIds = allAssets.map(asset => asset._id)
  }
  // after getting all the assets, check in the work order tasks model to get all _id then check the inspector evidence 
  const workOrderTasks = await WorkOrderTaskModel.find({assetId: {$in: assetIds}}).distinct('workOrderId')
  
  const allWorkOrders = await Promise.all(workOrderTasks.map(async(id) => { 
    const result = await WorkOrderModel.findById(id)
    return result
  }))
 
  return customResponse.successResponse('Inspector Evidence', allWorkOrders, res)
})

const allWorkOrderTask = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
  // get all the task
  const {workOrderId} = req.query
  if(!workOrderId){ 
    return customResponse.badRequestResponse('The work order id is required', res)
  }
  const tasks = await WorkOrderTaskModel.find({workOrderId: workOrderId}).populate('assetId assetTaskType').sort({scheduledDate: 1})
  return customResponse.successResponse('tasks', tasks, res)

})

const allTaskEvidence = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
  // get all the task
  const {workOrderTaskId} = req.query
  if(!workOrderTaskId){ 
    return customResponse.badRequestResponse('The work order task id is required', res)
  }
  const existingTask = await WorkOrderTaskModel.findById(workOrderTaskId)
  if(!existingTask){ 
    return customResponse.badRequestResponse('There is no work order task with this id', res)
  }
  const inspectorEvidence = await InspectorEvidenceModel.find({workOrderTaskId: workOrderTaskId}).populate('inspector')
  const cleanerEvidence = await CleanerEvidenceModel.find({workOrderTaskId: workOrderTaskId}).populate('cleaner')

  const data = {
    inspectorEvidence, 
    cleanerEvidence
  }
  return customResponse.successResponse('task evidence', data, res)

})
export default{ 
    getRoomFromTask, 
    getImagesFromTask, 
    getAllWorkOrder, 
    allWorkOrderTask, 
    allTaskEvidence
}