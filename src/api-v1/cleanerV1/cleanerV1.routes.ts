import { Router } from "express"
import controller from './cleanerV1.controller'
import { handleMulterErrors, upload } from "../../config/multerConfig"

export default () => { 
    const cleanerRoutes = Router()

    cleanerRoutes.get('/hello', controller.helloCleanerV1)

    cleanerRoutes.get('/', controller.getWorkOrder)
    cleanerRoutes.get('/asset-task', controller.getAssetTask)
    cleanerRoutes.post('/upload', upload.single('image'), handleMulterErrors, controller.uploadEvidence)

    cleanerRoutes.patch('/delete', controller.deleteEvidence)
    cleanerRoutes.post('/submit', controller.submitTask)
    return cleanerRoutes
}