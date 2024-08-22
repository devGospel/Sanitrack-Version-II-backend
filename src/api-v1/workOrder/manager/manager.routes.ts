import { Router } from "express"
import controller from './manager.controller'
import { requireRole } from "../../../middlewares/requireRole"
import { Roles } from "../../../constant/roles"

export default () => {
    const workOrderManagerRoutes = Router()

    workOrderManagerRoutes.get('/', controller.hello)
    workOrderManagerRoutes.get('/mss-table', requireRole([Roles.MANAGER]), controller.managerMssTable)

    workOrderManagerRoutes.post('/generate', requireRole([Roles.MANAGER]), controller.generateMssManager)
    workOrderManagerRoutes.post('/reset', requireRole([Roles.MANAGER]), controller.resetMssManager )

    workOrderManagerRoutes.get('/teams', requireRole([Roles.MANAGER, Roles.INSPECTOR, Roles.SUPERVISOR]), controller.availableTeam)
    workOrderManagerRoutes.get('/inspector', requireRole([Roles.MANAGER, Roles.INSPECTOR, Roles.SUPERVISOR]), controller.availableInspector)
    return workOrderManagerRoutes
}