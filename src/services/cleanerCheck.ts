import mongoose from "mongoose"
import CleanerFacilityModel from "../models/cleanerFacilities"

export const facilityCleanerCheck = async (cleanerId: mongoose.Schema.Types.ObjectId, facilityId: string) => { 
    const result = await CleanerFacilityModel.findOne({
        facilityId: facilityId,
        assignedCleaners: { $in: cleanerId }
    });

    return {message: 'Cleaner is not assigned to this facility', found: result !== null};
}