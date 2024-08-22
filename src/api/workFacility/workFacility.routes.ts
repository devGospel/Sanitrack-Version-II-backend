import { Router } from "express"
import workFacilityController from "./workFacility.controller"
import validate from "../../middlewares/validate";
import validator from "../../validator/facilityTiming";

export default () => { 
    const workFacilityRouter = Router()

    workFacilityRouter.post('/add',  workFacilityController.addFacilityWorkOrder)
    workFacilityRouter.get('/single', workFacilityController.getFacilityWorkOrder)
    workFacilityRouter.get('/', workFacilityController.getAllFacilityWorkOrder)
    workFacilityRouter.get('/details', workFacilityController.getFacilityWorkOrderDetails)
    
    workFacilityRouter.post('/save', workFacilityController.saveFacilityWorkOrder)
    workFacilityRouter.get('/all-pre-saved', workFacilityController.getAllPreSavedFacilityWorkOrder)
    workFacilityRouter.get('/pre-saved', workFacilityController.getSavedFacilityWorkOrder)
    workFacilityRouter.get('/pre-saved-details', workFacilityController.preSavedFacilityTimingDetails)
    
    workFacilityRouter.get('/supervisors', workFacilityController.getUsers)
    workFacilityRouter.get('/facility-cleaning-dashboard', workFacilityController.workFacilityDashboard)

    workFacilityRouter.get('/facility-overall-cleaning', workFacilityController.overAllPerformance)
    return workFacilityRouter
}
