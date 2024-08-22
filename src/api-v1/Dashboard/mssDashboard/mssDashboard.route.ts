import { Router } from "express"
import controller from "./mssDashboard.controller"
import { requireRole } from "../../../middlewares/requireRole"
import { Roles } from "../../../constant/roles"
export default () => { 
    const mssDashboard = Router()
    
    mssDashboard.get('/',  requireRole([Roles.ADMIN]), controller.getMssTable)
    mssDashboard.get('/today', requireRole([Roles.ADMIN]), controller.currentMss)

    mssDashboard.get('/monthly-missed', requireRole([Roles.ADMIN]), controller.monthlyMissedCleaning)
    mssDashboard.get('/top-missed', requireRole([Roles.ADMIN]), controller.topMissedMonthlyCleaning)

    mssDashboard.get('/manager/today', requireRole([Roles.ADMIN, Roles.MANAGER, Roles.INSPECTOR, Roles.SUPERVISOR]), controller.currentMssManager)
    mssDashboard.get('/manager/monthly-missed', requireRole([Roles.MANAGER]), controller.facilityMonthlyMissedCleaning)
    mssDashboard.get('/manager/top-missed', requireRole([Roles.MANAGER]), controller.facilityTopMonthlyMissed)

    mssDashboard.get('/view-mss-detail', requireRole([Roles.ADMIN, Roles.MANAGER, Roles.INSPECTOR, Roles.SUPERVISOR]), controller.assetTaskSchedule)

    mssDashboard.post('/details/today', requireRole([Roles.ADMIN, Roles.MANAGER, Roles.INSPECTOR, Roles.SUPERVISOR]), controller.currentMssStatus)
    return mssDashboard
}