import { Router, Request, Response, NextFunction } from 'express';
import customResponse from '../../helpers/response';
import { requireRole } from "../../middlewares/requireRole"
import { Roles } from "../../constant/roles"
import cleanerV1Routes from "../../api-v1/cleanerV1/cleanerV1.routes"
import inspectorRoutes from "../../api-v1/inspector/inspector.routes"
import dashboardRoutes from "../../api-v1/Dashboard"
import taskRoutes from '../../api/task/task.route';
import workScheduleRoutes from "../../api-v1/workSchedule/workSchedule.routes"
import usersRoute from "../../api/users/users.route"
import roomRoutes from "../../api/rooms/rooms.route"
import roleRouter from "../../api/role/role.route"
import permissionRouter from "../../api/permissions/permission.route"
import locationIndex from "../../api/location/index"
import evidenceRoute from "../../api/evidence/evidence.route"
import workerHistory from '../../api/history/history.route'
import notificationRoute from '../../api/notifications/notification.route';
import userroleRoute from '../../api/userrole/userrole.route';
import searchRouter from '../../api/search/search.route';
// import cleaningItemsRouter from '../api/cleaningItemss/cleaningItems.route';
import roomCleaningRouter from "../../api/roomTimer/roomTimer.route"
import courseRouter from '../../api/courses/course.route';
import lessonRouter from '../../api/lessons/lesson.route';
import training from '../../api/trainingCourse/trainingCourse.route';
import libraryRouter from '../../api/library/library.route'
import tagRouter from '../../api/tags/tags.route';
import chemcialGroupRouter from '../../api/chemicalGroup/cg.routes'
import chemicalInventoryRoute from '../../api/chemicalInventory/cI.routes'
import cleaningItemsRouter from '../../api/cleaningItemss/cleaningItems.route';
import workFacilityRouter from '../../api/workFacility/workFacility.routes';
import teamRoute from '../../api/teams/team.route';
import roomAssetRoutes from '../../api/assetGroup/assetGroup.routes';
import facilityAttendanceRoutes from '../../api/facilityAttendance/facilityAttendance.routes';
import staffAttendanceRoute from '../../api/attendance/attendance.routes'
import chemicalMixRoutes from '../../api/chemicalMix/cm.routes'

import cleanerRouter from '../../api/cleaner/cleaner.route';
import inspectorRouter from '../../api/inspector/inspector.route';
import protectiveElementRoutes from '../../api-v1/protectiveElement/protectiveElement.routes';
import taskTypeRoutes from '../../api-v1/taskType/taskType.routes';
import frequencyRoutes from '../../api-v1/Frequency/frequency.routes';
import assetIndex from "../../api/assets/index";
import workOrderIndex from '../../api-v1/workOrder/index';
import evidenceRoutes from "../../api-v1/evidenceLevel/evidencelevel.routes"
import certificationsRoutes from '../../api-v1/certifications/certifications.routes';
import uploadRoutes from '../../api-v1/historical/historical.routes'
import diaryRoutes from '../../api-v1/diary/diary.routes';
import loginLogsRoutes from '../../api-v1/LoginLogs/loginLogs.routes';

export default () => { 
    const routeV1 = Router()

    routeV1.use("",  usersRoute());

    routeV1.use("/room", requireRole([Roles.ADMIN, Roles.MANAGER]), roomRoutes());

    routeV1.use("/task", taskRoutes());

    // routeV1.use("/cleaner-dashboard", cleanerRouter())

    // routeV1.use("/inspector", inspectorRouter())

    routeV1.use('/roles', requireRole([Roles.ADMIN]), roleRouter())

    routeV1.use('/permissions', requireRole([Roles.ADMIN]), permissionRouter())

    routeV1.use('/locations', locationIndex())

    routeV1.use('/evidence', evidenceRoute())

    routeV1.use('/work-history', workerHistory())

    routeV1.use('/user-role', requireRole([Roles.ADMIN]), userroleRoute())

    routeV1.use('/notification', notificationRoute())

    routeV1.use('/search', searchRouter())

    routeV1.use('/cleaning-items', requireRole([Roles.ADMIN]), cleaningItemsRouter())

    routeV1.use('/room-timer', roomCleaningRouter()) //COntains everything for the facility cleaning timer

    routeV1.use('/course', courseRouter())

    routeV1.use('/course-lesson', lessonRouter()) //why are you invisible???

    routeV1.use('/library', libraryRouter())

    routeV1.use('/training', training())

    routeV1.use('/tag', tagRouter())

    routeV1.use('/chemical-group', requireRole([Roles.ADMIN]), chemcialGroupRouter())

    routeV1.use('/chemical-inventory', requireRole([Roles.ADMIN]), chemicalInventoryRoute())

    routeV1.use('/work-facility', workFacilityRouter())

    routeV1.use('/team', requireRole([Roles.ADMIN, Roles.MANAGER]), teamRoute())

    routeV1.use('/asset-group',requireRole([Roles.ADMIN]), roomAssetRoutes()) // route to handle assets in the system/ room since assets are currently tied to rooms

    routeV1.use('/facility-attendance', facilityAttendanceRoutes()) // route to handle facility attendance mostly for manager 

    routeV1.use('/chemical-mix', chemicalMixRoutes())// Chemical Mix routes

    routeV1.use('/staff-attendance', staffAttendanceRoute())

    routeV1.use('/cleaner', requireRole([Roles.CLEANER]), cleanerV1Routes())

    routeV1.use('/inspector', requireRole([Roles.INSPECTOR]), inspectorRoutes())

    routeV1.use('/dashboard', dashboardRoutes())

    routeV1.use('/work-schedule', requireRole([Roles.ADMIN]), workScheduleRoutes())

    routeV1.use('/protective-element', protectiveElementRoutes())

    routeV1.use('/task-type', requireRole([Roles.ADMIN, Roles.MANAGER]), taskTypeRoutes())

    routeV1.use('/frequency', frequencyRoutes())

    routeV1.use('/assets', assetIndex())

    routeV1.use('/work-order', workOrderIndex())

    routeV1.use('/evidence-level', evidenceRoutes())

    routeV1.use('/certificate', requireRole([Roles.ADMIN, Roles.MANAGER]), certificationsRoutes())

    routeV1.use('/historical', uploadRoutes())

    routeV1.use('/diary', diaryRoutes())

    routeV1.use('/login-logs', loginLogsRoutes())
    // Handle requests for unknown routes
    routeV1.use((_, res: Response) => {
        customResponse.notFoundResponse('Route not found', res);
    });

    
    return routeV1
}