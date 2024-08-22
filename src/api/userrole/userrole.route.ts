import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import { permissionCheck } from "../../middlewares/security"
import userRole from './userrole.controller'

export default () => { 
    const userRoleRouter = Router()

    const {admin} = UserPermissions

    userRoleRouter.get("/", permissionCheck(admin.viewUserRole), userRole.getUserRole)
    userRoleRouter.post("/delete", permissionCheck(admin.deleteUserRole), userRole.deleteUserRole)
    
    return userRoleRouter
}