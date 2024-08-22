import { Router } from "express"
import workOrderManagerRoutes from './manager/manager.routes'
import workOrderRoutes from "./workOrder.routes"

export default () => {
    const workOrderIndex = Router()

    workOrderIndex.use('/', workOrderRoutes()), 
    workOrderIndex.use('/manager', workOrderManagerRoutes())
    return workOrderIndex
}