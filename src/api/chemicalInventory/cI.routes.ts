import { Router } from "express"
import cIController from "./cI.controller"
import validate from "../../middlewares/validate"
import validator from "./cI.validation"
import { Roles } from "../../constant/roles"
import { requireRole } from "../../middlewares/requireRole"

export default () => { 
    const chemicalInventoryRoute = Router()
    
    chemicalInventoryRoute.post('/add',  validate(validator.addChemical), cIController.addChemical)
    chemicalInventoryRoute.get('/',  cIController.getChemical)
    chemicalInventoryRoute.get('/single',  validate(validator.accessSingle), cIController.getSingleChemical)
    chemicalInventoryRoute.put('/update',  validate(validator.addChemical), cIController.updateChemical)
    return chemicalInventoryRoute
}