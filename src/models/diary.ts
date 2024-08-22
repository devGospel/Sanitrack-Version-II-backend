import mongoose, { model, Schema } from "mongoose"
import User from "./user"

export interface IDiary extends Document{ 
    title: string, 
    note: string, 
    recordedBy: mongoose.Types.ObjectId
}

const diarySchema = new Schema<IDiary>({ 
    title: {type: String, required: true}, 
    note: {type: String, required: true},
    recordedBy: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true}
}, {
    timestamps: true
})

const DiaryModel = model('diary', diarySchema)

export default DiaryModel