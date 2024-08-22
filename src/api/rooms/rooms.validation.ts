import Joi from 'joi';
import mongoose from 'mongoose';
import { frequency } from '../../models/workOrderSchedule';

// Define and export validation schemas using Joi
interface CreateRoomSchema {
    roomName: string;
    location_id: mongoose.Types.ObjectId;
}

interface UpdateRoomSchema {
    roomId: string;
    roomName: string;
    locationId: string;
    detail: [{ name: string}];
}

interface DeleteRoomSchema {
    roomId: string;
}


const validationSchemas = {
  // Schema for creating a room
  createRoom: Joi.object<CreateRoomSchema>({
    roomName: Joi.string().required().label('The room name is required'),
    location_id: Joi.string().required().label('The location ID is required'),
   }),

  // Schema for room update
    updateRoom: Joi.object<UpdateRoomSchema>({
        roomId: Joi.string().required(),
        roomName: Joi.string().required(),
        locationId: Joi.string().required(),
        detail: Joi.array().items(Joi.object({
            name: Joi.string().required(),
        })),
    }),

    // Schema for deleting room by id
    deleteRoom: Joi.object<DeleteRoomSchema>({
        roomId: Joi.string().required(),
    }),

};

export default validationSchemas;
