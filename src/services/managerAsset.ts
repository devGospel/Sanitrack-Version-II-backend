// managerService.js

import mongoose, { Types } from "mongoose";
import ManagerFacilityModel from "../models/managerFacilities";
import RoomModel from "../models/room";
import RoomDetailModel from "../models/roomDetail";

export const managerFacilityCheck = async (managerId: mongoose.Types.ObjectId, facilityId: string) => {
    if (!facilityId || !mongoose.Types.ObjectId.isValid(facilityId as string)) {
        return {message: "Invalid facility Id", found: false, data: []};
    }

    const managerFacility = await ManagerFacilityModel.findOne({ managerId })
        .populate({ path: 'assignedFacilities', model: 'Location' });

    if (!managerFacility || !managerFacility.assignedFacilities) {
        return { message: 'No facility found for the manager', found: false, data: [] };
    }

    // Check if the facilityId is part of the manager's assigned facilities
    const assignedFacility = managerFacility.assignedFacilities.find(facility => facility._id.toString() === facilityId);
    if (!assignedFacility) {
        return {message: 'Facility ID not assigned to the manager', found: false, data: []};
    }
    return{
        message: '',
        found: true,
        data: []
    }

}
export const getAllAssetsForManager = async (managerId: mongoose.Types.ObjectId, facilityId:string) => {
    // Get all the facility IDs assigned to the manager
    const facilityCheck = await managerFacilityCheck(managerId, facilityId)
    if(!facilityCheck?.found){
        return { message: facilityCheck?.message, found: false, data: [] };
    }

    
    // Fetch rooms for all facility IDs
    const rooms = await RoomModel.find({ location_id: new Types.ObjectId(facilityId ) });

    if (!rooms.length) {
        return { message: 'No rooms found for the manager facility', found: false, data: [] };
    }

    // Extract room IDs
    const roomIds = rooms.map(room => room._id);

    // Fetch all assets for these room IDs
    const assets = await RoomDetailModel.find({ roomId: { $in: roomIds } }).populate('roomId');

    return { message: 'Manager assets', found: true, data: assets };
};

export const managerAssetCheck = async (managerId: mongoose.Types.ObjectId, facilityId: string, assetId: string) =>{ 
    const allManagerAsset = await getAllAssetsForManager(managerId, facilityId)
    if(allManagerAsset.data.length == 0){ 
        return { message: 'No assets', found: false, data: [] }; 
    }
    const allAssetIds = allManagerAsset.data.map(asset => asset._id.toString())
    if(!allAssetIds || allAssetIds.includes(assetId)){ 
        return {message: 'Asset does not belong to facility', found: false, data: []}
    }
    return {found: true}
}