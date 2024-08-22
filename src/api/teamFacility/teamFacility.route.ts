import { Router } from "express"
import teamFacilityController from "./teamFacility.controller"

export default () => { 
    const teamFacilityRoutes = Router();
    teamFacilityRoutes.post('/create', teamFacilityController.createTeamFacility);
    return teamFacilityRoutes
}