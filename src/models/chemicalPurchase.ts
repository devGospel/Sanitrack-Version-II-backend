import mongoose, { Schema, model } from "mongoose";
import LibraryResource from "./library";

interface chemicalPurchaseDetails extends Document{ 
    supplier:  String,
    purchase_date: Date,
    unit_price: Number,
    total_cost: Number,
    purchase_order_number: String,
    expiration_date: Date,
    storage_location: String,
    safety_data_sheet: mongoose.Types.ObjectId
}

const chemicalInventorySchema = new Schema<chemicalPurchaseDetails>({ 
    supplier: { type: String, required: false, default: null },
    purchase_date: { type: Date, required: false, default: null },
    unit_price: { type: Number, required: false, default: null },
    total_cost: { type: Number, required: false, default: null },
    purchase_order_number: {type: String, required: false, default: null}, 
    expiration_date: {type: Date, required: false, default: null}, 
    storage_location: {type: String, required: false, default: null}, 
    safety_data_sheet: {type: mongoose.Schema.Types.ObjectId, ref: LibraryResource, default: null, required: false}
})

const ChemicalPurchaseModel = model<chemicalPurchaseDetails>('chemical_purchase', chemicalInventorySchema)

export default ChemicalPurchaseModel