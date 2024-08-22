import mongoose, { Schema, model } from "mongoose";
import User from "./user";
import WorkOrderModel from "./workorder";

interface InspectorGeneralEvidence extends Document {
    workOrderId: mongoose.Types.ObjectId, 
    inspector: mongoose.Types.ObjectId,
    generalNote?: String[],
    generalEvidence?: String[],
}

const InspectorEvidenceSchema = new Schema<InspectorGeneralEvidence>({
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: WorkOrderModel, required: true }, 
    inspector: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    generalNote: [{ type: String, required: false, default: '' }], 
    generalEvidence: [{type: String, required: false}], 
});

const InspectorGeneralEvidenceModel = model<InspectorGeneralEvidence>('inspector_general_evidence', InspectorEvidenceSchema)
export default InspectorGeneralEvidenceModel