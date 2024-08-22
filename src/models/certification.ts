import { model, Schema } from "mongoose"

export interface ICertification extends Document{ 
    name: String, 
    level: Number

}

const certificationSchema = new Schema<ICertification>({ 
    name: {type: String, unique: true, required: true}, 
    level: {type: Number, min: 0, max:2, default: 0}
}, {
    timestamps: true
})

const CertificationModel = model('certifications', certificationSchema)

export default CertificationModel