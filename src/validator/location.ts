import Joi from "joi";

// Define and export validation schemas using Joi
interface CreateLocationSchema {
  facility_name: string;
  country: string;
  state: string;
  city: string;
  postal_code?: string;
  lat: number; 
  long: number
}

interface DeleteLocationSchema {
    location_id: string
}
const LocationValidationSchema = {
  // Schema for creating a location
  createLocation: Joi.object<CreateLocationSchema>({
    facility_name: Joi.string().required().label('The facility name is required'),
    country: Joi.string().required().label('The country is required'),
    state: Joi.string().required().label('The state is required'),
    city: Joi.string().required().label('The city is required'),
    postal_code: Joi.string().optional(),
    lat: Joi.number().required().label('The lat for the facility is required'),
    long: Joi.number().required().label('The long for the facility is required')
  }),

  updateLocation: Joi.object<CreateLocationSchema>({
    facility_name: Joi.string().optional(),
    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    postal_code: Joi.string().optional(),
  }),

    deleteLocation: Joi.object<DeleteLocationSchema>({
        location_id: Joi.string().required()
    })
};

export default LocationValidationSchema;
