import mongoose, {Schema, model} from "mongoose";
import RoomModel from "./room";
import TaskTypeModel from "./taskType";
import FrequencyModel from "./frequency";
import RoomDetailModel from "./roomDetail";
import CertificationModel from "./certification";

export interface RoomDetailCleaningType extends Document{ 
    roomId: mongoose.Types.ObjectId, 
    assetId: mongoose.Types.ObjectId,
    cleaningType: mongoose.Types.ObjectId, 
    cleaningTypeFrequency: mongoose.Types.ObjectId, 
    certification: mongoose.Types.ObjectId[],
    isDefault: Boolean,
    active: Boolean,
    mssActive: Boolean
}

const roomDetailTaskSchema = new Schema<RoomDetailCleaningType>({ 
    roomId: {type: mongoose.Schema.Types.ObjectId, ref: RoomModel, required: true}, 
    assetId: {type: mongoose.Schema.Types.ObjectId, ref: RoomDetailModel, required:true},
    cleaningType: {type: mongoose.Schema.Types.ObjectId, ref: TaskTypeModel, required: true}, 
    cleaningTypeFrequency:{type: mongoose.Schema.Types.ObjectId, ref: FrequencyModel, required: true}, 
    certification: [{type: mongoose.Schema.Types.ObjectId, ref: CertificationModel, required: false}],
    isDefault: {type: Boolean, default: false, required: true},
    active: {type: Boolean, default: true, required: true}, 
    mssActive: {type: Boolean, default: false, required: true}
})

const  AssetTaskType = model<RoomDetailCleaningType>('asset_task_type', roomDetailTaskSchema)

export default AssetTaskType