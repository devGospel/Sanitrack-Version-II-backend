import { Router } from "express"
import team from "./team.controller";
import validate from "../../middlewares/validate";
import validator from "../../validator/teams";

export default () => { 
    const teamRoutes = Router()
    teamRoutes.post('/create', validate(validator.createTeam), team.createTeam)
    teamRoutes.get('/', team.getAll)
    teamRoutes.get('/details', team.getById)
    teamRoutes.delete('/delete', team.deleteTeam)
    return teamRoutes
}