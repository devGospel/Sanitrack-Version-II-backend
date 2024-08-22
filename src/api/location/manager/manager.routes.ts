import { Router } from "express"
import controller from './manager.controller'
export default () => { 
    const locationManagerRoutes = Router()

    locationManagerRoutes.get('/hello', controller.helloRoute)
    locationManagerRoutes.get('/', controller.getManagerLocation)
    locationManagerRoutes.get('/cleaners', controller.getFacilityCleaners)

    locationManagerRoutes.get('/rooms', controller.facilityRooms)
    return locationManagerRoutes
}