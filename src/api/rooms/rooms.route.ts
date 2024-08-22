import { Router } from "express";
import validate from "../../middlewares/validate";
import room from './rooms.controller'
import validator from "./rooms.validation";
import { permissionCheck } from "../../middlewares/security";
import { UserPermissions } from "../../constant/permissions";
import { requireRole } from "../../middlewares/requireRole";
import { Roles } from "../../constant/roles";



export default () => {
    const roomRoutes = Router();
    const { admin } = UserPermissions

    // Route for creating room
    roomRoutes.post("/create-room", requireRole([Roles.ADMIN, Roles.MANAGER]), validate(validator.createRoom), room.createRoom);
    roomRoutes.get("/get", requireRole([Roles.ADMIN]), room.getAllRooms);
    roomRoutes.get("/all-rooms", requireRole([Roles.ADMIN, Roles.MANAGER]), room.getAllRooms2);
    roomRoutes.get("/get-single", requireRole([Roles.ADMIN, Roles.MANAGER]), room.getRoom);
    // roomRoutes.get("/:facilityId", requireRole([Roles.ADMIN, Roles.MANAGER]), room.getRoomsByFacilityId);
    // roomRoutes.put("/update", requireRole([Roles.ADMIN]), validate(validator.updateRoom), room.updateRoom);
    roomRoutes.delete("/delete", requireRole([Roles.ADMIN]), room.deleteRoom);
    roomRoutes.get("/location", requireRole([Roles.ADMIN]), room.getRoomByLocationId)// Route to get rooms based on location 
    // roomRoutes.get('/comparison', requireRole([Roles.ADMIN]), room.roomItemComparison)
    // Route to get the details for the facility overview page [this includes the room details, tasks, images and planned time along side actual time]
    // roomRoutes.get('/task', requireRole([Roles.ADMIN, Roles.MANAGER]), room.getTaskForRoom)

    roomRoutes.delete('/delete-all', room.deleteMultipleRooms)


    // Route for unassigned rooms
    // roomRoutes.get('/unassigned-rooms', permissionCheck(admin.getUnassignedRoom), room.getRoomsNotInTask)
    // Route to get the assigned rooms based on the location passed 
    // roomRoutes.get('/assigned-rooms', room.getRoomInTask)

    
    //Routes for manager 
    roomRoutes.get('/manager', requireRole([Roles.MANAGER]), room.managerRooms)

    return roomRoutes
}