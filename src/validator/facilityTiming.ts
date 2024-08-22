import Joi from 'joi';
import mongoose from 'mongoose';

interface CreateFacilityTimingSchema { 
    facility_id: mongoose.Types.ObjectId; 
    assigned_supervisors: Array<mongoose.Types.ObjectId>; 
    scheduled_date: Date
    repeat: string 
    stages: [
        {name: string, stage_hour: string, stage_minute: string}
    ]
}

const facilityTimingValidationSchema = { 
    createFacilityTiming: Joi.object<CreateFacilityTimingSchema>({
        facility_id: Joi.string().required().label('Facility id is required'), 
        assigned_supervisors: Joi.array().items(
            Joi.string().required()
        ).required().label('Superviors are required'),
        scheduled_date: Joi.string().isoDate().label('Scheduled date is required'),
        repeat: Joi.string().valid('Daily', 'Weekly', 'Monthly', 'daily', 'weekly', 'monthly').required().label('Repeat frequency is required'),
        stages: Joi.array().items(
            Joi.object({ 
                name: Joi.string().required().label('Stage name is required'), 
                stage_hour: Joi.string().required().label('Stage hour is required'),
                stage_minute: Joi.string().required().label('Stage minute is required')
            })
        ).required().label('The stages for the facility timing is required')
    })

}

export default facilityTimingValidationSchema
