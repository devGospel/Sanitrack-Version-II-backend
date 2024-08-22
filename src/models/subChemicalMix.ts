import mongoose, { Schema, model } from "mongoose";
import ChemicalMixModel from "./chemicalMix";
import User from "./user";

interface subChemicalMix extends Document {
    name: String,
    originalMix: mongoose.Types.ObjectId,
    cleanerId: mongoose.Types.ObjectId,
    chemicalName: String,
    unit: String,
    date_added: Date,
    titrationCount: Number

}

const subChemicalMixSchema = new Schema<subChemicalMix>({
    name: { type: String, required: true },
    cleanerId: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    originalMix: { type: mongoose.Schema.Types.ObjectId, ref: ChemicalMixModel, required: true },
    chemicalName: { type: String, required: true },
    unit: { type: String, required: true },
    date_added: { type: Date, default: Date.now(), required: true },
    titrationCount: { type: Number, required: true },
})

const SubChemicalMixModel = model<subChemicalMix>('sub_chemical_mix', subChemicalMixSchema);

export default SubChemicalMixModel