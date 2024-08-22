import { Router } from "express"
import assetRoute from "./assets.routes"
import assetTaskCertificationRoute from "./assetTaskCertifications/atc.routes"
import { requireRole } from "../../middlewares/requireRole"
import { Roles } from "../../constant/roles"

export default () => {
    const assetIndex = Router()

    assetIndex.use('/', assetRoute()), 
    assetIndex.use('/certificate', requireRole([Roles.ADMIN, Roles.MANAGER]), assetTaskCertificationRoute())
    return assetIndex
}