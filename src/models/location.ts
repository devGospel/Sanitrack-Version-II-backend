import mongoose, { Document, Schema } from 'mongoose';
import modelPrefix  from '../constant/codes';
const AutoIncrement= require('mongoose-sequence')(mongoose) // not sure why import did not work 


interface Location extends Document {
    facilityPrefix: String, 
    facilityCode: Number
    facility_name: string,
    country: string;
    state: string;
    city: string;
    postal_code: string; 
    location: {
        type: string, 
        coordinates: Number[]
    }
    
}

const locationSchema = new Schema({
    facilityPrefix: {type: String, default: `${modelPrefix.facilityPrefix}`, required: true}, 
    facilityCode: {type: Number, required: false, unique: true},
    facility_name: {type: String, required: false, default: null},
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, require: true },
    postal_code: { type: String, default: 'empty' }, 
    location: {
        type: {type: String, enum: ['Point'], required: false}, 
        coordinates: {type: [Number], required: false}
    }
    
});

locationSchema.index({location: '2dsphere'}) //this line is added to allow us make use of $near for geo calculations 

locationSchema.plugin(AutoIncrement, {
    inc_field: 'facilityCode',             
    start_seq: 1,                              
    leading_zeros: true
  });

const Location = mongoose.model<Location>('Location', locationSchema);

async function assignAutoIncrementIds() {
    const items = await Location.find({});
    for (let i = 0; i < items.length; i++) {
      items[i].facilityCode = i + 1; // Assign incrementing ID starting from 1
      items[i].facilityPrefix = modelPrefix.facilityPrefix
      await items[i].save();
    }
    console.log('Auto-increment IDs assigned to all items.');
  }
  
//   assignAutoIncrementIds()
export default Location;