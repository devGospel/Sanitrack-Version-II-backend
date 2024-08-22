import mongoose, { Date, Document, Schema, model } from "mongoose";
import TeamModel from "./teams";
import Location from "./location";

interface TeamFacility extends Document{ 
    teamId: mongoose.Types.ObjectId, 
    locationId: mongoose.Types.ObjectId, 
}

const teamFacilitySchema = new Schema<TeamFacility>({ 
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: TeamModel, required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: Location, required: true },
});

const TeamFacilityModel = model<TeamFacility>('TeamFacility', teamFacilitySchema)
export default TeamFacilityModel