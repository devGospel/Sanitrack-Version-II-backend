import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck, middleware } from "../../middlewares/security"
import upload from "../../middlewares/fileUpload"
import courseAssessment from './courseAssessment.controller'

export default () => { 
    const assessmentRouter = Router()

    const { admin } = UserPermissions

    assessmentRouter.post("/create", courseAssessment.addAssessmentQuestion)
    assessmentRouter.get("/:courseId/all-assessments", courseAssessment.getAllAssessmentQuestionsForCourse)
    assessmentRouter.get("/:questionId", courseAssessment.getSingleAssessmentQuestion)
    assessmentRouter.patch("/update", courseAssessment.updateAssessmentQuestion)
    assessmentRouter.delete("/delete", courseAssessment.deleteAssessmentQuestion)
 
    return assessmentRouter
}
