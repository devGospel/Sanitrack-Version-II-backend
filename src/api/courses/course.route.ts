import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck, middleware } from "../../middlewares/security"
//import upload from "../../middlewares/fileUpload"
import { s3Config, uploadCourseThumbnail } from "../../middlewares/UploadToAWSBucket"
import course from './course.controller'


export default () => { 
    const courseRouter = Router()

    const {admin} = UserPermissions

    courseRouter.post("/create", uploadCourseThumbnail.single('thumbnailUrl'), course.createCourse)
    courseRouter.get("/all-courses", course.getAllCourses)
    courseRouter.patch("/:id/update", uploadCourseThumbnail.single('thumbnailUrl'), course.updateCourse)
    courseRouter.delete("/:id/delete", course.deleteCourse)
    courseRouter.patch("/:id/publish", course.publishCourse)
    courseRouter.patch("/:id/unpublish", course.unpublishCourse)
    courseRouter.get("/published-courses", course.getPublishedCourses)

    return courseRouter
}