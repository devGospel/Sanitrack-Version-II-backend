import { Router } from "express"
import controller from './loginLogs.controller'

export default () => { 
    const loginRoute = Router()

    loginRoute.get('/', controller.allLoginLogs)
    return loginRoute
}