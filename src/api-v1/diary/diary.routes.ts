import { Router } from "express"
import controller from './diary.controller'

export default () => { 
    const diaryRoute = Router()

    diaryRoute.post('/create', controller.addDiary)
    diaryRoute.get('/', controller.getDiary)
    return diaryRoute
}