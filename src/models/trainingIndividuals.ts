import mongoose, { Document, Schema, model } from "mongoose";
import Training from '../models/training';
import User from '../models/user';
import UserRoles from '../models/userRoles'
//Use Enums later 
interface TrainingIndividual extends Document { 
    userId: mongoose.Types.ObjectId;
    status: string;
    remark: string;
    trainingId: mongoose.Types.ObjectId;
    //userRole: mongoose.Types.ObjectId;
    isCertified: boolean;
    dateCreated: Date;
    dateUpdated: Date;
}

const trainingIndividualSchema = new Schema<TrainingIndividual>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    status: { type: String, required: true },
    remark: { type: String, required: false },
    trainingId: { type: mongoose.Schema.Types.ObjectId, ref: Training, required: true },
    //userRole: { type: mongoose.Schema.Types.ObjectId, ref: UserRoles, required: true },
    isCertified: { type: Boolean, required: true, default: false },
}, {
    timestamps: {
        createdAt: 'dateCreated',
        updatedAt: 'dateUpdated'
    }
});

const TrainingIndividual = model<TrainingIndividual>('TrainingIndividual', trainingIndividualSchema);

export default TrainingIndividual;