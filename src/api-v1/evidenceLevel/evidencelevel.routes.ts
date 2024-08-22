import { Router } from "express"
import controller from './evidenceLevel.controller'
import { upload } from "../../config/multerConfig"

export default () => { 
    const evidenceRoutes = Router()

    evidenceRoutes.post('/create', controller.addEvidenceLevel)
    evidenceRoutes.get('/', controller.viewEvidence), 
    evidenceRoutes.patch('/', controller.updateEvidence)
    evidenceRoutes.patch('/archive', controller.archiveEvidence)
    return evidenceRoutes
}