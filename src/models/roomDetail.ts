import mongoose, { Schema, model} from 'mongoose';
import RoomModel from './room';
import TaskTypeModel from './taskType';
import FrequencyModel from './frequency';
import  modelPrefix  from '../constant/codes';
import { required } from 'joi';
const AutoIncrement= require('mongoose-sequence')(mongoose) // not sure why import did not work 

export enum assetFrequency{
  daily = "daily", 
  weekly = "weekly", 
  monthly = "monthly", 
  yearly = "yearly"
}
interface RoomDetail extends Document{ 
  name: String, 
  assetCode: Number,
  assetPrefix: String,
  frequency: mongoose.Schema.Types.ObjectId, 
  roomId: mongoose.Schema.Types.ObjectId
}
// Create a Mongoose schema for RoomDetail
const roomDetailSchema = new Schema({
  name: { type: String, required: true },
  assetCode: { type: Number, required: false, unique: true },
  assetPrefix: {type: String, default: `${modelPrefix.assetPrefix}`, required: true},
  frequency: { type: mongoose.Schema.Types.ObjectId, ref: FrequencyModel, required: false },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: RoomModel, required: false }
});

// Configure the AutoIncrement plugin
roomDetailSchema.plugin(AutoIncrement, {
  inc_field: 'assetCode',             
  start_seq: 1,                              
  leading_zeros: true
});


// Create a Mongoose model for RoomDetail
const RoomDetailModel = model<RoomDetail>('RoomDetail', roomDetailSchema);

async function assignAutoIncrementIds() {
  const items = await RoomDetailModel.find({});
  for (let i = 0; i < items.length; i++) {
    items[i].assetCode = i + 1; // Assign incrementing ID starting from 1
    items[i].assetPrefix = modelPrefix.assetPrefix
    await items[i].save();
  }
  console.log('Auto-increment IDs assigned to all items.');
}

// assignAutoIncrementIds()

export default RoomDetailModel;