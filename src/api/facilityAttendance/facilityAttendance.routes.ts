import { Router } from "express"
import validator from "../../validator/attendance/facilityAttendance"
import validate from "../../middlewares/validate"
import controller from './facilityAttendance.controller'

export default () => { 
    const facilityAttendanceRoute = Router()

    facilityAttendanceRoute.post('/create', validate(validator.createFacilityAttendance), controller.createFacilityAttendance )
    facilityAttendanceRoute.get('/', controller.getFacilityAttendance)

    facilityAttendanceRoute.get('/history', controller.facilityAttendanceHistory)
    
    return facilityAttendanceRoute
}