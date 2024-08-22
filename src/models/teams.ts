import mongoose, { Date, Document, Schema, model } from "mongoose";
import User from "./user";
import Location from "./location";
import Role from "./role";
import  modelPrefix from "../constant/codes";
import { formatCode } from "../utils/formatCode";

export interface Team extends Document{ 
    teamName: String; 
    teamCode: String; 
    teamPrefix: String;
    members: Member[];
    facilityId: mongoose.Schema.Types.ObjectId;
    dateCreated: Date;
}

interface Member {
    userId: mongoose.Schema.Types.ObjectId;
    roleId: {
        role_name: string;
        _id: mongoose.Schema.Types.ObjectId;
    };
}
const teamSchema = new Schema<Team>({ 
    teamName: {type: String, required: true}, 
    teamCode: { type: String, required: false, unique: true },
    teamPrefix: {type: String, default: `${modelPrefix.teamPrefix}`, required: true},
    members: [{
        userId: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true}, //Bella I need this for population
        roleId: {type: mongoose.Schema.Types.ObjectId, ref: Role, required: true}
    }],
    facilityId: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: false},
    dateCreated: {type: Date, required: true}
})

teamSchema.pre('save', async function (this: Team, next){ 
    if(this.isNew){ 
        try {
            const teamCount = await TeamModel.countDocuments()
            this.teamCode = formatCode(teamCount + 1)// Assign formatted team code
            console.log(teamCount)
            next();
        }
        catch (error) {
            console.log(`error from model ${error}`)
        }
    }
   
})
const TeamModel = model<Team>('team', teamSchema)
export default TeamModel