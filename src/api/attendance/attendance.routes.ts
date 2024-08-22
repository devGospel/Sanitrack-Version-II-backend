import { Router } from "express"
import controller from './attendance.controller'

export default () => { 
    const staffAttendanceRoute = Router()

    staffAttendanceRoute.post('/clock', controller.staffClockIn )
    staffAttendanceRoute.post('/select-facility', controller.selectFacility)
    staffAttendanceRoute.get('/', controller.currentAttendanceForStaff)

    staffAttendanceRoute.get('/staff-history', controller.staffAttendanceHistory)

    return staffAttendanceRoute
}