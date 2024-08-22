import { Schema, model } from "mongoose"

export enum unitType { 
    hourly = 'hourly', 
    daily = 'daily', 
    weekly = 'weekly', 
    monthly = 'monthly', 
    yearly = 'yearly'
}
export interface Frequency extends Document{ 
    name: String, 
    interval: Number, //The number of units between each scheduled event. For example, an interval of 3 with a unit of "hour" means every 3 hours.
    unit: String, //The unit of time (minute, hour, day, week, month, year) in which the interval is measured.
    occurrences?: Number, //The number of times an event occurs within the given unit. For instance, if you need to schedule an event twice a month, you can set occurrences to 2 and unit to "month".
    validStartHour?: Number, 
    validStopHour?: Number,
    cronExpression?: String,
    availableInterval?: Number, 
    excludeWeekend?: Boolean, 
    isDefault: Boolean,

}

const frequencySchema = new Schema<Frequency>({
    name: {type: String, required: true, unique: true}, 
    interval: {type: Number, required: true, default: 1}, 
    unit: {type: String, enum: Object.values(unitType), required: true}, 
    occurrences: {type: Number, default: 1, required: true},
    validStartHour: {type: Number, required: false}, // Optional
    validStopHour: {type: Number, required: false},    // Optional
    cronExpression: {type: String, default: null}, //this is for monthly
    availableInterval: {type: Number, default: null, required: false},
    excludeWeekend: {type: Boolean, required: true},
    isDefault: {type: Boolean, default: false}
  
})

const FrequencyModel = model<Frequency>('frequency', frequencySchema)

export default FrequencyModel