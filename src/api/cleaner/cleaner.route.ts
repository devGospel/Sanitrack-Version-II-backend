import { Router } from "express"
import cleaner from './cleaner.controller'
import taskController from '../task/task.controller'
import cleaningItemsController from "../cleaningItemss/cleaningItems.controller"
import cIController from "../chemicalInventory/cI.controller"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck } from "../../middlewares/security"
import validator from "../../validator/cleaner/index"
import validate from "../../middlewares/validate"
import chemicalInventoryValidationSchema from "../chemicalInventory/cI.validation"

export default () => { 
    const {cleanerPermission} = UserPermissions
    const cleanerRouter = Router()

    cleanerRouter.get('/active-task', cleaner.activeTasks)
    cleanerRouter.get('/all-facility', cleaner.allFacilitiesCleaned)

    cleanerRouter.get('/', permissionCheck(cleanerPermission.getLocation), cleaner.getRoomLocation)
    cleanerRouter.get('/rooms', validate(validator.accessRomms), permissionCheck(cleanerPermission.getRoom), cleaner.getAllRooms)
    cleanerRouter.get('/room-task', validate(validator.accessTaskForRooms), permissionCheck(cleanerPermission.getRoomDetail), cleaner.getRoomDetailsById)
    cleanerRouter.get('/cleaning-items',validate(validator.accessCleaningItems), cleaner.getCleaningItems)
    
    cleanerRouter.post('/confirm', validate(validator.confirmCleaningItems), cleaner.confirmCleaningItems) //confirm cleaning items given to cleaner
    cleanerRouter.get('/summary', validate(validator.accessTaskForRooms), taskController.taskSummary)

    cleanerRouter.get('/task-summary', cleaner.cleanerTaskSummary) //this is to get all the task summary assigned to a cleaner
    cleanerRouter.post('/room-details', validate(validator.uploadTaskImage), permissionCheck(cleanerPermission.uploadImage),cleaner.uploadDetailImages)
    cleanerRouter.post('/save', taskController.saveStartTime)
    cleanerRouter.get('/active-timer', taskController.activeTimer)

    // take the cleaner to an endpoint that shows them all the cleaning items in the inventory 
    cleanerRouter.get('/inventory', cleaningItemsController.getCleaningItem)
    cleanerRouter.post('/request', cleaner.requestCleaningItems)

    cleanerRouter.post('/test-result', validate(chemicalInventoryValidationSchema.testResult), cIController.testResult)
    return cleanerRouter
}