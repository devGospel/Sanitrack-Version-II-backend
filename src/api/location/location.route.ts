import { Router } from "express"
import { UserPermissions } from "../../constant/permissions"
import location from "./location.controller"
import validator from "../../validator/location"
import validate from "../../middlewares/validate"
import { permissionCheck } from "../../middlewares/security"
import { requireRole } from "../../middlewares/requireRole"
import { Roles } from "../../constant/roles"

export default () => {
    const locationRoutes = Router()
    const { admin } = UserPermissions

    locationRoutes.get('/single-location',  location.getLocationById)

    locationRoutes.get('/', requireRole([Roles.ADMIN]), location.getLocation)
    locationRoutes.post('/add', requireRole([Roles.ADMIN]), validate(validator.createLocation), location.addLocation)
    
    // locationRoutes.get('/admin-facility', requireRole([Roles.ADMIN]), location.getFacilityAssignedToAdmin)
    locationRoutes.put('/update', requireRole([Roles.ADMIN]), location.updateLocation)
    locationRoutes.delete('/delete', requireRole([Roles.ADMIN]), location.deleteLocation)

    // manager assigning facilities to cleaners 
    locationRoutes.post('/assign-manager', requireRole([Roles.ADMIN]), location.assignFacility)
    locationRoutes.post('/assign-cleaner', requireRole([Roles.ADMIN, Roles.MANAGER]), location.assignCleaner)
    locationRoutes.post('/assign-inspector', requireRole([Roles.ADMIN, Roles.MANAGER]), location.assignInspector)

    locationRoutes.post('/revoke-facility', requireRole([Roles.ADMIN]), location.revokeFacility)
    locationRoutes.get('/unassigned-facility', requireRole([Roles.ADMIN]), location.getUnAssignedFacility)

    locationRoutes.get('/rooms', requireRole([Roles.ADMIN, Roles.MANAGER]), location.getFacilityRooms)

    locationRoutes.get('/staff-facility', requireRole([Roles.MANAGER, Roles.CLEANER, Roles.INSPECTOR, Roles.SUPERVISOR]), location.staffFacilities)
    locationRoutes.get('/facilities', requireRole([Roles.ADMIN, Roles.MANAGER]), location.getAllFacilities);
    locationRoutes.get('/facilities/:facilityId', requireRole([Roles.ADMIN, Roles.MANAGER]), location.getFacilitiesById);
    return locationRoutes
}