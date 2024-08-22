import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck, middleware } from "../../middlewares/security"
import upload from "../../middlewares/fileUpload"
import { s3Config, uploadLessonThumbnail, uploadLessonVideo } from "../../middlewares/UploadToAWSBucket"
import lesson from './lesson.controller'


export default () => { 
    const lessonRouter = Router()

    const {admin} = UserPermissions

    lessonRouter.post("/:courseId/lesson/create", uploadLessonVideo.single('resourceUrl'), lesson.createLesson)
    lessonRouter.post("/:lessonId/lesson/thumbnail/add", uploadLessonThumbnail.single('thumbnailUrl'), lesson.uploadThumbnail)
    lessonRouter.get("/:courseId/all-lessons", lesson.getAllLessonsForCourse)
    lessonRouter.get("/lesson/:lessonId", lesson.getSingleLesson)
    lessonRouter.patch("/lesson/:lessonId/update", uploadLessonThumbnail.single('thumbnailUrl'), uploadLessonVideo.single('resourceUrl'), lesson.updateLesson)
    lessonRouter.delete("/lesson/:lessonId/delete", lesson.deleteLesson)
   
    return lessonRouter;
}