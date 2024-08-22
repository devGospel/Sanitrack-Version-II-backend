import mongoose, { Document, Schema, model, Types } from 'mongoose';
import RoomDetailModel from './roomDetail';
import Location from './location';
import  modelPrefix  from '../constant/codes';
import { formatCode } from '../utils/formatCode';


// Define interface for room
export interface Room extends Document {
  roomName: string;
  location_id: mongoose.Types.ObjectId;
  roomCode: String, 
  roomPrefix: String, 
  flag: string
}

// Create a Mongoose schema for Room
const roomSchema = new Schema<Room>({
  roomName: { type: String, required: true },
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: Location, required: true },
  roomCode: {type: String, required: false, unique: true},
  roomPrefix: {type: String, default: `${modelPrefix.roomPrefix}`},
  flag: {type: String, default: 'PRESENT'}
});

roomSchema.pre('save', async function (this: Room, next){ 
    if(this.isNew){ 
      try {
        const roomCount = await RoomModel.countDocuments()
        this.roomCode = formatCode(roomCount + 1)// Assign formatted team code
        console.log(roomCount)
        next();
      }catch (error) {
        console.log(`error from model ${error}`)
      }
    }
})

// Create a Mongoose model for Room
const RoomModel = model<Room>('Room', roomSchema);
export default RoomModel;
