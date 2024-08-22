import { Router } from "express"
import validate from "../../middlewares/validate"
import validator from './frequency.validation'
import controller from './frequency.controller'
import { requireRole } from "../../middlewares/requireRole"
import { Roles } from "../../constant/roles"

export default () => { 
    const frequencyRoutes = Router()
    frequencyRoutes.post('/', validate(validator.createFrequency), requireRole([Roles.ADMIN, Roles.MANAGER]), controller.addFrequency)
    frequencyRoutes.get('/', requireRole([Roles.ADMIN, Roles.MANAGER]), controller.getFrequency), 
    frequencyRoutes.get('/single', requireRole([Roles.ADMIN, Roles.MANAGER]), controller.getSingleFrequency)

    return frequencyRoutes
}