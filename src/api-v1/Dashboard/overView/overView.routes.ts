import { Router } from "express"
import controller from './overView.controller' 
export default () => { 
    const overViewRoutes = Router()

    overViewRoutes.get('/', controller.getCardDetails)
    return overViewRoutes
}