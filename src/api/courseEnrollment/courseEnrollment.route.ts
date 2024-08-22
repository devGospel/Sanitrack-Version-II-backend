import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck, middleware } from "../../middlewares/security"
import courseEnrollment from "./courseEnrollment.controller"

export default () => { 
    const courseEnrollmentRouter = Router()

    const { admin } = UserPermissions

    courseEnrollmentRouter.post("/enroll", courseEnrollment.enrollUserInCourse)
    courseEnrollmentRouter.get("/enrolled-courses", courseEnrollment.getAllEnrolledCourses)
    
 
    return courseEnrollmentRouter
}