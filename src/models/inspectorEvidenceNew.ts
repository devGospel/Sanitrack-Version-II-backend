import mongoose, { Schema, model } from "mongoose";
import User from "./user";
import TaskModel from "./task";
import RoomDetailModel from "./roomDetail";
import WorkOrderModel from "./workorder";
import WorkOrderTaskModel from "./workOrderTasks";
import { getCurrentDateInLosAngeles } from "../utils/date";

interface InspectorEvidence extends Document {
    workOrderId: mongoose.Types.ObjectId, 
    workOrderTaskId: mongoose.Types.ObjectId,
    inspector: mongoose.Types.ObjectId,
    evidence?: {
        images?:{url: String, uploadedAt?: Date}[], 
        videos?: {url: String, uploadedAt?: Date}[], 
        notes?: {note: String, uploadedAt?: Date}[]
    }
}

const InspectorEvidenceSchema = new Schema<InspectorEvidence>({
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: WorkOrderModel, required: true }, 
    inspector: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    workOrderTaskId: {type: mongoose.Schema.Types.ObjectId, ref: WorkOrderTaskModel, required: true},
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
});

const InspectorEvidenceModel = model<InspectorEvidence>('inspector_evidence_new', InspectorEvidenceSchema)
export default InspectorEvidenceModel