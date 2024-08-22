import mongoose from "mongoose";

export interface cleaningData{ 
    cleaning_id: mongoose.Types.ObjectId, 
    item_name: string, 
    quantity: number
}

export interface cleaningItems { 
    equipment: String,
    description: String,
    quantity: number, 
    type: String, //consumable [gloves etc], tools, detergents these are the types when it comes to cleaning Items
    pairs: Boolean,
    image: String
}

// Define the interface for a single detail in groupDetail
export interface GroupDetail {
    roomId: mongoose.Types.ObjectId;
    detailId: mongoose.Types.ObjectId;
}

// Define the interface for the complete group detail including detailInfo
export interface GroupDetailWithInfo extends GroupDetail {
    detailInfo?: any; // Adjust the type of detailInfo as needed
}

export interface AssetCleaingItem {
    cleaingItemId: mongoose.Types.ObjectId,
    quantity: number,
    unit: string
}

export interface IAssetTaskType{ 
    roomId: {
        _id: mongoose.Schema.Types.ObjectId,
        roomName: String,
        location_id: mongoose.Schema.Types.ObjectId,
        flag: String,
        roomCode: Number,
        roomPrefix: String
    },
    assetId: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        assetPrefix: String,
        roomId: mongoose.Schema.Types.ObjectId,
        assetCode: Number,
        frequency: mongoose.Schema.Types.ObjectId
    },
    cleaningType: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        description: String,
        isDefault: Boolean,
    },
    cleaningTypeFrequency: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        interval: Number,
        unit: String,
        occurrences: Number,
        cronExpression: String,
        availableInterval: Number,
        excludeWeekend: Boolean,
        isDefault: Boolean
    },
    isDefault: Boolean,
    active: Boolean,
    mssActive: Boolean,

}

export interface Evidence {
    workOrderId: string;
    assetId: string;
    note?: string;
    images?: Express.Multer.File[]; // Assuming File is the type of your file
}

export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    // Add any other properties you need from the result
}