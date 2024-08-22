import { Router } from "express"
import validator from "./assets.validation"
import controller from './assets.controller'
import validate from '../../middlewares/validate'
import { requireRole } from "../../middlewares/requireRole"
import { Roles } from "../../constant/roles"

export default () => { 
    const assetRoutes = Router()

    assetRoutes.post('/', validate(validator.createAsset), controller.addAsset);
    assetRoutes.get('/', controller.getAllAssets);
    assetRoutes.get('/manager', controller.getAllAssetsManager)
    assetRoutes.get('/manager/schedule', controller.getAllAssetsScheduleManager)
    assetRoutes.get('/schedule', controller.getAllAssetsSchedule);
    assetRoutes.get('/active', controller.generalScheduleWorkOrder);
    assetRoutes.get('/single-schedule', controller.getAssetSchedule);

    assetRoutes.get('/room-asset', controller.assetScheduleByRoom)
    assetRoutes.get('/room', controller.assetByRoom);
    assetRoutes.get('/all', requireRole([Roles.ADMIN, Roles.MANAGER]), controller.getAllAssets);
    assetRoutes.get('/facilityId', requireRole([Roles.ADMIN, Roles.MANAGER]), controller.getAssetsByFacilityId);

    assetRoutes.get('/asset-details', controller.assetDetails);
    assetRoutes.get('/asset-task-details',controller.assetTaskDetails);
    assetRoutes.post('/add-task', validate(validator.addTaskToAsset), controller.addTaskToAsset);

    assetRoutes.patch('/update-asset-task', controller.updateAssetTaskStatus)
    return assetRoutes
}