import { Router } from "express"
import evidence from "./evidence.controller"
import { requireRole } from "../../middlewares/requireRole"
import { Roles } from "../../constant/roles"

export default () => { 
    const evidenceRouter = Router()

    evidenceRouter.get('/room-name', evidence.getRoomFromTask)
    evidenceRouter.get('/images', evidence.getImagesFromTask)

    evidenceRouter.get('/work-order', requireRole([Roles.ADMIN, Roles.MANAGER, Roles.SUPERVISOR, Roles.INSPECTOR]), evidence.getAllWorkOrder)
    evidenceRouter.get('/task', requireRole([Roles.ADMIN, Roles.MANAGER, Roles.SUPERVISOR, Roles.INSPECTOR]), evidence.allWorkOrderTask)
    evidenceRouter.get('/task-evidence', requireRole([Roles.ADMIN, Roles.MANAGER, Roles.SUPERVISOR, Roles.INSPECTOR]), evidence.allTaskEvidence)
    return evidenceRouter
}