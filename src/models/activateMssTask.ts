import mongoose, { Schema, model } from "mongoose"
import Location from "./location"
interface MssAssetTask extends Document{ 
    facilityId: mongoose.Types.ObjectId, 
    roomId: mongoose.Types.ObjectId,
    assetId: mongoose.Types.ObjectId, 
    assetTaskType: mongoose.Types.ObjectId
}

const mssAssetTaskSchema = new Schema<MssAssetTask>({ 
    facilityId: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: false}, 
    roomId: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: false},
    assetId: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: false}, 
    assetTaskType: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: false}
})

const MssAssetTaskModel = model<MssAssetTask>('active_mss_asset_task', mssAssetTaskSchema)

export default MssAssetTaskModel