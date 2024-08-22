import { Router } from "express"
import validate from '../../middlewares/validate'
import validator from './taskType.validation'
import controller from './taskType.controller'
import taskTypeController from "./taskType.controller"

export default () => {
    const taskTypeRoute = Router()

    taskTypeRoute.post('/', validate(validator.createCleaningType), controller.createTaskType)
    taskTypeRoute.get('/', controller.getAll);
    taskTypeRoute.get('/:id', controller.getSingle);
    taskTypeRoute.put('/:id',
        validate(validator.updateTaskType),
        taskTypeController.update
    );

    return taskTypeRoute
}