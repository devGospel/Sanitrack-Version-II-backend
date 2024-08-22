// Asset management groups 
import mongoose, { Document, Schema, model, Types, Date } from 'mongoose';
import RoomModel from './room';
import RoomDetailModel from './roomDetail';
import {GroupDetail} from '../types/interface'


interface AssetGroup extends Document{ 
    groupName: String, 
    groupDetail: GroupDetail[]
    dateCreated: Date
}

const assetGroupSchema = new Schema<AssetGroup>({ 
    groupName: {type: String, required: true}, 
    groupDetail: [{ 
        roomId: {type: mongoose.Schema.Types.ObjectId, ref: RoomModel, required: true},
        detailId: {type: mongoose.Schema.Types.ObjectId, ref: RoomDetailModel, required: true}, 
    }],
    dateCreated: {type: Date, required: true}
})

const AssetGroupModel = model<AssetGroup>('asset_group', assetGroupSchema)

export default AssetGroupModel