import { Router } from "express"
import mssDashboardRoute from "./mssDashboard/mssDashboard.route"
import overViewRoutes from "./overView/overView.routes"
export default () =>{
    const dashboardRoutes = Router()
    
    dashboardRoutes.use('/mss', mssDashboardRoute())
    dashboardRoutes.use('/overview', overViewRoutes())
    
    return dashboardRoutes
}