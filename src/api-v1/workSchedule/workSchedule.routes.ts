import {Router} from 'express'
import controller from './workSchedule.controller'

export default () => { 
    const workScheduleRoute = Router()

    workScheduleRoute.get('/', controller.getWorkSchedule )
    return workScheduleRoute
}