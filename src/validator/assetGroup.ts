import Joi from 'joi';
import mongoose from 'mongoose';

interface createAssetGroup{ 
    groupName: String; 
    groupDetail: [{
        roomId:{type: mongoose.Types.ObjectId}, 
        detailId: {type: mongoose.Types.ObjectId}
    }]
}

const assetGroupValidationSchema = { 
    createAssetGroup: Joi.object<createAssetGroup>({ 
        groupName: Joi.string().min(3).max(50).required().label('Group name is required'), 
        groupDetail: Joi.array().items(
            Joi.object({ 
                roomId: Joi.string().required().label('Room Id is required'), 
                detailId: Joi.string().required().label('Detail Id is required')
            }) 
        ).required().label('Room Id and Detail Id are required')
    })
}

export default assetGroupValidationSchema 