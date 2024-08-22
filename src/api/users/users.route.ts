import { Router } from "express"
import validate from "../../middlewares/validate";
import validator from "../../validator/user";
import { UserPermissions } from "../../constant/permissions";
import {Roles} from '../../constant/roles'
import { permissionCheck } from "../../middlewares/security";
import user from "./users.controller";
import { requireRole } from "../../middlewares/requireRole";


export default () => { 
    const userRoutes = Router()
    const {admin} = UserPermissions

    // Route for user login
    userRoutes.post("/login", validate(validator.login), user.login);
    userRoutes.post("/select-role", user.selectRoleLogin)
    userRoutes.post('/forgot-password', user.forgotPassword)
    userRoutes.post('/reset-password', user.resetPassword)
    userRoutes.get('/user-profile', permissionCheck(admin.viewUserProfile), user.userProfile)
    userRoutes.put("/edit-profile", user.editProfile)
    

    userRoutes.post("/create-user", requireRole([Roles.ADMIN]), validate(validator.createUser), user.createUser);
    userRoutes.get("/get-user",user.getUser);
    userRoutes.get("/get-all-cleaner", requireRole([Roles.ADMIN]),  user.getAllCleaners)
    userRoutes.get("/get-all-inspector", requireRole([Roles.ADMIN]), user.getAllInspectors)
    userRoutes.get("/get-all-managers", requireRole([Roles.ADMIN]), user.getAllManagers)
    userRoutes.get("/get-all-users", requireRole([Roles.ADMIN]), user.getAllUsers);
    userRoutes.get('/staff', requireRole([Roles.ADMIN]), user.getStaffByName)
    userRoutes.patch("/update-username",validate(validator.updateUsername),user.updateUsername);

    // Route for deleting user account
    userRoutes.put("/delete-user/", requireRole([Roles.ADMIN]),user.deleteUser);
    userRoutes.put("/update-user-status/", requireRole([Roles.ADMIN]), user.updateUserStatus)

    userRoutes.post('/logout', user.logOut)

    userRoutes.get('/manager/cleaners', requireRole([Roles.MANAGER]), user.managerCleaners)
    userRoutes.get('/manager/inspectors',requireRole([Roles.MANAGER]), user.managerSupervisors)
    return userRoutes
}