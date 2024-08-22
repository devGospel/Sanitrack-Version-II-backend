import { Router } from "express"
import inspector from "./inspector.controller"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck } from "../../middlewares/security"
import taskController from "../task/task.controller"
import cIController from "../chemicalInventory/cI.controller"
import validator from "../../validator/inspector/index"
import validate from "../../middlewares/validate"
import chemicalInventoryValidationSchema from "../chemicalInventory/cI.validation"

export default () => {
    const inspectorRouter = Router()
    const { inspectorPermission } = UserPermissions

    inspectorRouter.get('/active-task', inspector.activeTasks)
    inspectorRouter.get('/all-facility', inspector.allFacilitiesCleaned)

    inspectorRouter.get('/', permissionCheck(inspectorPermission.getLocation), inspector.getRoomLocation)
    inspectorRouter.get("/rooms", validate(validator.accessLocation), permissionCheck(inspectorPermission.getRoom), inspector.getInspectorRoom)
    inspectorRouter.get("/room-task", validate(validator.accessTaskForRooms), permissionCheck(inspectorPermission.getRoomDetail), inspector.getRoomTask)
    inspectorRouter.put("/approve-task", validate(validator.updateTask), permissionCheck(inspectorPermission.approveTask), inspector.updateTaskItem)

    inspectorRouter.post('/save', taskController.saveStartTime)
    inspectorRouter.get('/task-summary', inspector.inspectorTaskSummary)
    inspectorRouter.get('/active-timer', taskController.activeTimer)

    inspectorRouter.get('/summary', taskController.taskSummary)
    inspectorRouter.get('/requested-cleaning-items', inspector.getAllCleaningItemsRequest)
    inspectorRouter.get('/cleaning-items', validate(validator.accessSingleRequestedCleaningItem), inspector.getSingleCleaningItemRequest)
    inspectorRouter.get('/request-detail', inspector.getRequestDetail)
    inspectorRouter.put('/approve-cleaning-items', inspector.approveCleaningItems)
    inspectorRouter.put('/decline', inspector.rejectRequestedCleaningItem)

    inspectorRouter.get('/all-items', inspector.allCleaningItems)
    inspectorRouter.post('/close', inspector.closeWorkOrder)

    inspectorRouter.post('/test-result', validate(chemicalInventoryValidationSchema.testResult), cIController.testResult)

    inspectorRouter.get('/assigned-facilties', inspector.inspectorFacility)
    inspectorRouter.get('/facility-stages', inspector.facilityStages)

    inspectorRouter.post('/facility-actual-time', inspector.facilityActualStartTimer)
    inspectorRouter.post('/facility-actual-stop', inspector.facilityActualStopTimer)
    inspectorRouter.post('/facility-note', inspector.stageCleaningNote) // handle the inspector adding note for a stage
    inspectorRouter.post('/facility-release', inspector.releaseFacility)


    inspectorRouter.post('/add-inspector-evidence', inspector.addInspectorEvidence)

    return inspectorRouter
}