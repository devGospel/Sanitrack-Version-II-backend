import { Router } from "express"
import controller from './inspector.controller'
import { handleMulterErrors, upload } from "../../config/multerConfig"

export default () => { 
    const inspectorRoutes = Router()

    inspectorRoutes.get('/', controller.getWorkOrder), 
    inspectorRoutes.get('/asset', controller.getAssetTask), 
    inspectorRoutes.post('/upload', upload.single('image'), handleMulterErrors, controller.uploadEvidence)
    inspectorRoutes.post('/approve', controller.approveTasks)

    inspectorRoutes.get('/mss-table', controller.mssTable)
    return inspectorRoutes
}