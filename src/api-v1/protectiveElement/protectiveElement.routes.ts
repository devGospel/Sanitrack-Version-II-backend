import { Router } from "express"
import validate from '../../middlewares/validate'
import validator from './protectiveElement.validation'
import controller from './protectiveElement.controller'

export default () => {
    const protectiveRoute = Router()

    protectiveRoute.post('/', validate(validator.createProtectiveElement), controller.createPPE)
    protectiveRoute.get('/', controller.getAll);
    protectiveRoute.get('/:id', controller.getSingle);
    protectiveRoute.put('/:id',
        validate(validator.updateProtectiveElement),
        controller.update
    );
    protectiveRoute.delete('/:id', controller.deleteSingle);
    return protectiveRoute
}