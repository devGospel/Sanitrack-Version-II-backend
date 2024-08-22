import mongoose, { Document, Schema, model } from "mongoose";
import Location from '../models/location'
import Team from '../models/teams'
import User from '../models/user'
import Library from "../models/library";

interface Training extends Document { 
    name: string;
    creator: mongoose.Types.ObjectId;
    trainers: mongoose.Types.ObjectId[]; // Array of trainer IDs
    location: mongoose.Types.ObjectId[]; // Array of location IDs
    team: mongoose.Types.ObjectId[]; // Array of team IDs
    trainee: mongoose.Types.ObjectId[]; // Array of trainee IDs
    trainingResources: mongoose.Types.ObjectId[]; // Array of library resources
    scheduledDate: Date;
    scheduledTime: string;
    dateCreated: Date;
}

const trainingSchema = new Schema<Training>({
    name: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    trainers: [{ type: mongoose.Schema.Types.ObjectId, ref: User, required: true }],
    location: [{ type: mongoose.Schema.Types.ObjectId, ref: Location, required: true }],
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: Team }],
    trainee: [{ type: mongoose.Schema.Types.ObjectId, ref: User }],
    trainingResources: [{ type: mongoose.Schema.Types.ObjectId, ref: Library }],
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
}, {
    timestamps: {
        createdAt: 'dateCreated',
        updatedAt: 'dateUpdated'
    }
});

const Training = model<Training>('Training', trainingSchema);

export default Training;