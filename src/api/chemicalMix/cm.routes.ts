import { Router } from "express"
import cmController from "./cm.controller"
import { requireRole } from "../../middlewares/requireRole"
import { Roles } from "../../constant/roles"


export default () => {
    const chemicalMixRoute = Router()
    chemicalMixRoute.post('/add', requireRole([Roles.ADMIN]), cmController.addChemicalMix)
    chemicalMixRoute.get('/', cmController.getChemicalMixes)
    chemicalMixRoute.get('/single/:id', cmController.getChemicalMixById)
    chemicalMixRoute.put('/update/:id', requireRole([Roles.ADMIN]), cmController.updateChemicalMix)
    chemicalMixRoute.post('/submix', requireRole([Roles.CLEANER]), cmController.addSubChemicalMix)

    return chemicalMixRoute
}