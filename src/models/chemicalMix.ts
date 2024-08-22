import mongoose, { Schema, model } from "mongoose";
import SubChemicalMixModel from "./subChemicalMix";
import ChemicalInventoryModel from "./chemicalInventory";

interface chemicalMix extends Document {
    name: String,
    chemicalId: mongoose.Types.ObjectId,
    notes: String,
    unit: String,
    date_added: Date,
    minimum_concentration: Number,
    maximum_concentration: Number,
    concentration_unit: String,
    titrationCount: Number,

}

const chemicalMixSchema = new Schema<chemicalMix>({
    name: { type: String, required: true },
    chemicalId: { type: mongoose.Schema.Types.ObjectId, ref: ChemicalInventoryModel, required: true },
    notes: { type: String, required: true },
    unit: { type: String, required: true },
    titrationCount: { type: Number, required: true },
    date_added: { type: Date, default: Date.now(), required: true },
    minimum_concentration: { type: Number, default: 0.0, required: false },
    maximum_concentration: { type: Number, default: 0.0, required: false },
    concentration_unit: { type: String, default: 'PPM', required: false },
})

const ChemicalMixModel = model<chemicalMix>('chemical_mix', chemicalMixSchema);

export default ChemicalMixModel