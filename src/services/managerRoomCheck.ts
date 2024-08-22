import mongoose from "mongoose";
import ManagerFacilityModel from "../models/managerFacilities";
import CleanerFacilityModel from "../models/cleanerFacilities";
import User from "../models/user";

// This function is a service that is used to check if the logged in manager is allowed to view details for a particular room 
export const managerRoomCheck = async (loggedInUser: any, room?: any) => {
    const managerFacilities = await ManagerFacilityModel.findOne({ managerId: loggedInUser });

    if (!managerFacilities) {
        return 'No Facilities assigned to this manager';
    }

    // Check if the room's facility is within the manager's assigned facilities
    const facilityIds = managerFacilities.assignedFacilities;
    // we want to check if the location_id from the room is in any of the facilityId 
    if (!facilityIds.includes(room.location_id)) {
        return 'You are not allowed to view information regarding this room'
    }
    return ''
}

export const managerFacilityCheck = async (loggedInUser: any, facility: mongoose.Types.ObjectId) => {
    // check if facility passed is assigned to the logged in user 
    const facilityCheck = await ManagerFacilityModel.findOne({ managerId: loggedInUser, assignedFacilities: { $in: facility } })
    if (!facilityCheck) {
        return 'You are not allowed to carry out any action on this facility'
    }
    return ''
}


export const managerCheckCleaner = async (loggedInUser: any, cleanerId: any) => {
    const managerFacilities = await ManagerFacilityModel.findOne({ managerId: loggedInUser });

    if (!managerFacilities) {
        return 'No Facilities assigned to this manager';
    }
    //check if the cleaners is in the same assigned facility with the manager
    const facilityIds = managerFacilities.assignedFacilities;
    const cleanerFacility = await CleanerFacilityModel.findOne({ assignedCleaners: cleanerId });

    if (!cleanerFacility || !facilityIds.includes(cleanerFacility.facilityId)) {
        return 'You are not allowed to view information regarding this cleaner';
    }

    return '';
};