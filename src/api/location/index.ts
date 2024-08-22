import { Router } from "express"
import locationRoute from "./location.route"
import locationManagerRoutes from "./manager/manager.routes"

export default () => {
    const locationIndex = Router()

    locationIndex.use('/', locationRoute()), 
    locationIndex.use('/manager', locationManagerRoutes())
    return locationIndex
}