import { model, Schema } from "mongoose"


export interface EvidenceLevel extends Document { 
    name: String, 
    minValue: Number, 
    maxValue: Number,
    level: Number // 0, 1, 2 represents Active, Archived, Deleted 
}

const evidenceSchema = new Schema<EvidenceLevel>({ 
    name: {type: String, required: true, unique: true}, 
    minValue: {type: Number, min: 0, require: false}, 
    maxValue: {type: Number, min: 0, require: false}, 
    level: {type: Number, default: 0, min: 0, max: 3, require: false }
})

const EvidenceLevelModel = model<EvidenceLevel>('evidence_level_work_order', evidenceSchema)

export default EvidenceLevelModel