import Joi from "joi";
import mongoose from "mongoose";

interface createFacility { 
    facility_name: string, 
    location_id: mongoose.Types.ObjectId
}

interface params { 
    locationId: mongoose.Types.ObjectId, 
    facilityId: mongoose.Types.ObjectId
}
const facilityValidationSchema = { 
    createFacility: Joi.object<createFacility>({ 
        facility_name: Joi.string().required().label('The facility name is required'), 
        location_id: Joi.string().required().label('The location id is required')
    }), 
    accessFacilityByLocation: Joi.object<params>({ 
        locationId: Joi.string().required().label('The location Id is required')
    }), 
    accessSingleFacility: Joi.object<params>({ 
        facilityId: Joi.string().required().label('The facility id is required')
    }), 
}

export default facilityValidationSchema