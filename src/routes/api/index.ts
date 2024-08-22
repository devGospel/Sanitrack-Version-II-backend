import { Router, Request, Response, NextFunction } from 'express';
import customResponse from '../../helpers/response';
import usersRoute from '../../api/users/users.route';
import roomRoutes from '../../api/rooms/rooms.route'
import taskRoutes from '../../api/task/task.route';
import cleanerRouter from '../../api/cleaner/cleaner.route';
import inspectorRouter from '../../api/inspector/inspector.route';
import roleRouter from '../../api/role/role.route';
import permissionRouter from '../../api/permissions/permission.route';
import locationRoute from '../../api/location/location.route';
// import documentRouter from '../api/documents/document.route';
import evidenceRoute from '../../api/evidence/evidence.route';
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
import workOrderRoutes from '../../api-v1/workOrder/workOrder.routes';
import teamFacilityRoute from '../../api/teamFacility/teamFacility.route';
// Create an Express Router
export default () => {
    const routes = Router();

    // Use the userRoutes for the root path ("/")
    routes.use("", usersRoute());

    routes.use("/room", roomRoutes());

    routes.use("/task", taskRoutes());

    routes.use('team-facility', teamFacilityRoute());

    routes.use("/cleaner-dashboard", cleanerRouter())

    routes.use("/inspector", inspectorRouter())

    routes.use('/roles', roleRouter())

    routes.use('/permissions', permissionRouter())

    routes.use('/locations', locationRoute())

    // routes.use('/documents', documentRouter())

    routes.use('/evidence', evidenceRoute())

    routes.use('/work-history', workerHistory())

    routes.use('/user-role', userroleRoute())

    routes.use('/notification', notificationRoute())

    routes.use('/search', searchRouter())

    routes.use('/cleaning-items', cleaningItemsRouter())

    routes.use('/room-timer', roomCleaningRouter()) //COntains everything for the facility cleaning timer

    routes.use('/course', courseRouter())

    routes.use('/course-lesson', lessonRouter()) //why are you invisible???

    routes.use('/library', libraryRouter())

    routes.use('/training', training())

    routes.use('/tag', tagRouter())

    routes.use('/chemical-group', chemcialGroupRouter())

    routes.use('/chemical-inventory', chemicalInventoryRoute())

    routes.use('/work-facility', workFacilityRouter())

    routes.use('/team', teamRoute())

    routes.use('/asset-group', roomAssetRoutes()) // route to handle assets in the system/ room since assets are currently tied to rooms

    routes.use('/facility-attendance', facilityAttendanceRoutes()) // route to handle facility attendance mostly for manager 

    routes.use('/chemical-mix', chemicalMixRoutes())// Chemical Mix routes

    routes.use('/staff-attendance', staffAttendanceRoute())

    
    // Handle requests for unknown routes
    routes.use((_, res: Response) => {
        customResponse.notFoundResponse('Route not found', res);
    });

    return routes
}
