import { Router } from "express"
import role from './role.controller'

export default () => { 
    const roleRouter = Router()

    roleRouter.get('/',  role.getRole)
    roleRouter.post('/add', role.addRole)
    roleRouter.post('/assign', role.assignRole)
    roleRouter.delete('/delete', role.deleteRole)
    roleRouter.get("/staff", role.getStaffRole)

    return roleRouter
}