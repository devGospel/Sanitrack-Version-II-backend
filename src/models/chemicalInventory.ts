import mongoose, { Schema, model } from "mongoose";
import ChemicalGroupModel from "./chemicalGroup";
import ChemicalPurchaseModel from "./chemicalPurchase";

interface chemicalInventory extends Document{ 
    name: String, 
    purchase_details: mongoose.Types.ObjectId,
    group: mongoose.Types.ObjectId,
    SKU: String, 
    description: String, 
    quantity: Number, 
    unit: String, 
    date_added: Date, 
    status: String, 
    minimum_concentration: Number, 
    maximum_concentration: Number, 
    concentration_unit: String, 
    tags: [mongoose.Types.ObjectId] 
}

const chemicalInventorySchema = new Schema<chemicalInventory>({ 
    name: {type: String, required: true}, 
    purchase_details: {type: mongoose.Schema.Types.ObjectId, ref: ChemicalPurchaseModel, required: true},
    group: {type: mongoose.Schema.Types.ObjectId, ref: ChemicalGroupModel, required: false}, 
    SKU: {type: String, unique: true, required: true}, 
    description: {type: String, required: true}, 
    quantity: {type: Number, required: true, default: 0}, 
    unit: {type: String, required: true}, 
    date_added: {type: Date, default: Date.now(), required: true}, 
    status: {type: String, default: 'Full'}, //is used here for alert management in case of when the quantity changes 
    minimum_concentration: {type: Number, default: 0.0, required: false},
    maximum_concentration: {type: Number, default: 0.0, required: false}, 
    concentration_unit: {type: String, default: 'PPM',required: false}, 
    tags: [{type: mongoose.Schema.Types.ObjectId, required: false}]
})

const ChemicalInventoryModel = model<chemicalInventory>('chemical_inventory', chemicalInventorySchema);

export default ChemicalInventoryModel