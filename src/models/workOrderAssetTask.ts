import mongoose, { model, Schema } from "mongoose";
import AssetTaskType from "./roomDetailCleaning";
import WorkOrderModel from "./workorder";

//work order mss
interface WorkOrderAssetTask extends Document{
    workOrderId: mongoose.Types.ObjectId, 
    assetTask: mongoose.Types.ObjectId
}

const workOrderAssetTaskSchema = new Schema<WorkOrderAssetTask>({
    workOrderId: {type: mongoose.Schema.Types.ObjectId, ref: WorkOrderModel, required: true}, 
    assetTask: {type: mongoose.Schema.Types.ObjectId, ref: AssetTaskType, required: true}
}, { 
    timestamps: true
})

const workOrderAssetTaskModel = model<WorkOrderAssetTask>('work_order_asset_task', workOrderAssetTaskSchema)

export default workOrderAssetTaskModel