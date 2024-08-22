import mongoose, { Types } from "mongoose"
import InspectorFacilityModel from "../models/inspectorFacilities";
import RoomModel from "../models/room";
import RoomDetailModel from "../models/roomDetail";

export const facilityInspectorCheck = async (cleanerId: mongoose.Types.ObjectId, facilityId: string) => { 
    const result = await InspectorFacilityModel.findOne({
        facilityId: facilityId,
        assignedInspectors: { $in: cleanerId }
    });

    return {message: 'Inspector is not assigned to this facility', found: result !== null};
}

// get the assets in that facility 
export const getAssetsForInspector = async (inspectorId:mongoose.Types.ObjectId, facilityId:string) => { 
    const facilityCheck = await facilityInspectorCheck(inspectorId, facilityId)
    if(!facilityCheck?.found){
        return { message: facilityCheck?.message, found: false, data: [] };
    }

    // Fetch rooms for all facility IDs
    const rooms = await RoomModel.find({ location_id: new Types.ObjectId(facilityId ) });

    if (!rooms.length) {
        return { message: 'No rooms found for the inspector facility', found: false, data: [] };
    }

    // Extract room IDs
    const roomIds = rooms.map(room => room._id);

    // Fetch all assets for these room IDs
    const assets = await RoomDetailModel.find({ roomId: { $in: roomIds } }).populate('roomId');

    return { message: 'Manager assets', found: true, data: assets };
}