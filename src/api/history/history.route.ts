import { Router } from "express"
import worker from './history.controller'
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck } from "../../middlewares/security"
export default () => { 
    const workerHistory = Router()
    const {admin} = UserPermissions

    workerHistory.get('/rooms', permissionCheck(admin.viewRoomHistory), worker.roomHistory )
    workerHistory.get('/cleaner',permissionCheck(admin.viewCleanerHistory), worker.cleanerHistory)
    workerHistory.get('/inspector',permissionCheck(admin.viewInspectorHistory), worker.inspectorHistory)

    workerHistory.get('/cleaner-task-summary',permissionCheck(admin.viewCleanerTaskSummary), worker.cleanerTaskSummary)

    return workerHistory
}