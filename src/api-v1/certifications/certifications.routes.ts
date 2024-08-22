import { Router } from "express"
import controller from './certifications.controller'
import validator from "./certifications.validation"
import validate from "../../middlewares/validate"
export default () => { 
    const certificationRoute = Router()

    certificationRoute.post('/create', validate(validator.createCertification), controller.addCertifications)
    certificationRoute.get('/', controller.getAllCertifications)
    certificationRoute.get('/single', controller.getSingleCertification)
    
    certificationRoute.patch('/update', validate(validator.updateCertification), controller.updateCertification)
    return certificationRoute
}