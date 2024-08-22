// this is for the cleaners to upload their evidence 
import mongoose, { Document, Schema, model, Types, Date } from 'mongoose';
import WorkOrderModel from './workorder';
import TeamModel from './teams';
import User from './user';
import TaskTypeModel from './taskType';
import RoomDetailModel from './roomDetail';
import { getCurrentDateInLosAngeles } from '../utils/date';
import WorkOrderTaskModel from './workOrderTasks';

interface CleanerEvidence extends Document{ 
    workOrderId: mongoose.Types.ObjectId,
    cleaner: mongoose.Types.ObjectId,
    workOrderTaskId: mongoose.Types.ObjectId,
    evidence?: {
        images?:{url: String, public_url: String, uploadedAt?: Date}[], 
        videos?: {url: String, public_url: String, uploadedAt?: Date}[], 
        notes?: {note: String,  uploadedAt?: Date}[]
    }
        
}

const cleanerEvidenceSchema = new Schema<CleanerEvidence>({
    workOrderId: {type: mongoose.Schema.Types.ObjectId, ref: WorkOrderModel,  required: true}, 
    workOrderTaskId: {type: mongoose.Schema.Types.ObjectId, ref: WorkOrderTaskModel, required: true}, 
    cleaner: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true},
    evidence: { 
        images: [
            {
                url: {type: String, required: false},
                public_url: {type:String, required:false},
                uploadedAt:{type:Date}
            }
        ], 
        videos: [
            {
                url: {type: String, required: false}, 
                public_url: {type:String, required:false},
                uploadedAt: {type: String}
            }
        ],
        notes: [
            {
                note:{type: String, required: false}, 
                uploadedAt: {type: Date}
            }
            
        ]
    }
})

const CleanerEvidenceModel = model<CleanerEvidence>('cleaner_evidence', cleanerEvidenceSchema)

export default CleanerEvidenceModel