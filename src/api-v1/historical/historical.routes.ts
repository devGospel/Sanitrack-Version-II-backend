import { Router } from "express"
import controller from './historical.controller'
import { excelUpload } from "../../config/excelMulterConfig"
import { handleMulterErrors } from "../../config/multerConfig"

export default () => { 
    const uploadRoute = Router()

    uploadRoute.post('/staff-upload', excelUpload.single('document'), handleMulterErrors, controller.uploadCleaner)
    uploadRoute.post('/generate-teams', controller.autoGenerateTeams)

    uploadRoute.post('/generate-work-order', controller.generateWorkOrderSample)
    uploadRoute.post('/work-order-upload', excelUpload.single('document'), handleMulterErrors, controller.uploadSampleStreamed)
    return uploadRoute
}