import { Router } from "express"
import validate from "../../middlewares/validate"
import validator from "../../validator/chemicalGroup"
import cgController from "./cg.controller"
export default () => { 
    const chemcialGroupRouter = Router()

    chemcialGroupRouter.post('/add', validate(validator.createChemicalGroup), cgController.addChemicalGroup)
    chemcialGroupRouter.get('/', cgController.getChemicalGroup)
    chemcialGroupRouter.get('/single', validate(validator.getSingleChemicalGroup), cgController.getSingleChemicalGroup)
    chemcialGroupRouter.put('/update', validate(validator.getSingleChemicalGroup), cgController.updateChemicalGroup)
    chemcialGroupRouter.delete('/delete', cgController.deleteChemicalGroup)

    
    return chemcialGroupRouter
}