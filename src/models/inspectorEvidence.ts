import mongoose, { Schema, model } from "mongoose";
import User from "./user";
import TaskModel from "./task";
import RoomDetailModel from "./roomDetail";

interface InspectorEvidence extends Document {
    task_id: mongoose.Types.ObjectId, 
    inspector_id: mongoose.Types.ObjectId,
    general_note: String[],
    general_evidence: String[],
    evidence_details: [
        { detail_id: mongoose.Types.ObjectId,  image_path: String[], note: String[]}
    ]
}

const InspectorEvidenceSchema = new Schema<InspectorEvidence>({
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: TaskModel, required: false, default: null }, 
    inspector_id: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    general_note: [{ type: String, required: false, default: '' }], 
    general_evidence: [{type: String, required: false}],
    evidence_details: [
        {
            detail_id: { type: mongoose.Schema.Types.ObjectId, ref: RoomDetailModel, required: true }, 
            image_path: [ { type: String, required: false, default: null } ], 
            note: [ { type: String, required: true, default: '' } ]
        }
    ]
});

const InspectorEvidence = model<InspectorEvidence>('inspector_evidence', InspectorEvidenceSchema)
export default InspectorEvidence