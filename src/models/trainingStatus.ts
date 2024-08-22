import mongoose, { Document, Schema, model } from 'mongoose';
import Training from './training';
import Team from './teams';
import User from './user';

// Define the types for status and remark
const statusEnum = ['pending', 'in progress', 'complete'];
const remarkEnum = ['pending','approved', 'rejected'];

// Interface for the schema
interface TeamMemberStatus {
    member: mongoose.Types.ObjectId;
    status: string;
    remark: string;
}

interface TeamTrainingStatus extends Document {
    creator: mongoose.Types.ObjectId;
    training: mongoose.Types.ObjectId;
    team: mongoose.Types.ObjectId;
    membersStatus: TeamMemberStatus[];
}

// Define the schema
const teamTrainingStatusSchema = new Schema<TeamTrainingStatus>({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    training: { type: mongoose.Schema.Types.ObjectId, ref: Training, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: Team, required: true },
    membersStatus: [{
        member: { type: mongoose.Schema.Types.ObjectId, ref: User },
        status: { type: String, enum: statusEnum, default: 'pending' },
        remark: { type: String, enum: remarkEnum, default: 'pending' }
    }]
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create the model
const TeamTrainingStatus = model<TeamTrainingStatus>('TeamTrainingStatus', teamTrainingStatusSchema);

export default TeamTrainingStatus;
