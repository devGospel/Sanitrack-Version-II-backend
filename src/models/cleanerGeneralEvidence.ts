// this is for the cleaners to upload their evidence 
import mongoose, { Document, Schema, model, Types, Date } from 'mongoose';
import WorkOrderModel from './workorder';
import TeamModel from './teams';
import User from './user';

export enum cleanerGeneralEvidenceType{ 
    image = 'image', 
    video = 'video'
}
interface CleanerEvidence extends Document{ 
    workOrderId: mongoose.Types.ObjectId,
    cleaner: mongoose.Types.ObjectId,
    generalEvidence: [{
        type: String, 
        url: String
    }]
}

const cleanerEvidenceSchema = new Schema<CleanerEvidence>({
    workOrderId: {type: mongoose.Schema.Types.ObjectId, ref: WorkOrderModel,  required: true}, 
    cleaner: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true},
    generalEvidence: [{ 
        type: {type: String, enum: Object.values(cleanerGeneralEvidenceType), required: true}, 
        url: {type: String, required: true }
    }]
})

const CleanerGeneralEvidenceModel = model<CleanerEvidence>('cleaner_general_evidence', cleanerEvidenceSchema)

export default CleanerGeneralEvidenceModel