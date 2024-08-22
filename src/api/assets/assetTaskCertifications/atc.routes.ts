import { Router } from "express"
import controller from "./atc.controller"
export default () => { 
    const assetTaskCertificationRoute = Router()

    assetTaskCertificationRoute.patch('/add-certificate', controller.addCertificate)
    assetTaskCertificationRoute.patch('/delete-certificate', controller.removeCertificate)
    
    assetTaskCertificationRoute.get('/', controller.getAssetTaskCertificate)
    return assetTaskCertificationRoute
}