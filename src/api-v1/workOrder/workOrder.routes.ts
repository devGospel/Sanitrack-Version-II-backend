import { Router } from "express"
import validate from "../../middlewares/validate";
import validator from "./workOrder.validation";
import controller from './workOrder.controller'
import { requireRole } from "../../middlewares/requireRole";
import { Roles } from "../../constant/roles";

export default () => { 
    const workOrderRoute = Router()

    workOrderRoute.post('/create', validate(validator.createWorkOrder), controller.createWorkOrder )
    workOrderRoute.post('/custom', controller.createCustomWorkOrder)
    
    workOrderRoute.get('/', controller.getAllWorkOrder)
    workOrderRoute.post('/generate', requireRole([Roles.ADMIN]), controller.generateWorkOrder)
    workOrderRoute.post('/reset', requireRole([Roles.ADMIN]), controller.resetMss)

    workOrderRoute.patch('/update', controller.updateWorkOrder)
    workOrderRoute.get('/mss-data', requireRole([Roles.ADMIN]), controller.mssTable)

    workOrderRoute.get('/teams', requireRole([Roles.ADMIN, Roles.MANAGER]), controller.availableTeam)
    workOrderRoute.get('/inspectors', requireRole([Roles.ADMIN, Roles.MANAGER]), controller.availableInspector)
    workOrderRoute.get('/cleaners', requireRole([Roles.ADMIN, Roles.MANAGER]), controller.availableCleaner)

    
    return workOrderRoute
}