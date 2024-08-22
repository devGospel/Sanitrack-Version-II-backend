import { Router } from "express"
import tagsController from "./tags.controller"
import tagValidationSchema from "../../validator/tags"
import validate from "../../middlewares/validate"

export default () => {
    const tagRouter = Router()
    tagRouter.post('/add', validate(tagValidationSchema.createTag), tagsController.addTag)
    tagRouter.get('/', tagsController.getTag), 
    tagRouter.get('/single', validate(tagValidationSchema.getSingleTag), tagsController.getSingleTag)
    tagRouter.put('/update', validate(tagValidationSchema.updateTag), tagsController.updateTag)
    tagRouter.delete('/delete', validate(tagValidationSchema.getSingleTag), tagsController.deleteTag)
    return tagRouter
}