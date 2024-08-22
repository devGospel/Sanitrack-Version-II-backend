import mongoose, { Document, Schema } from 'mongoose';

interface chemicalGroup extends Document{ 
    name: String, 

}

const chemicalGroupSchema = new Schema<chemicalGroup>({ 
    name: {type: String, unique: true, required: true}
})

const ChemicalGroupModel = mongoose.model<chemicalGroup>('chemical_group', chemicalGroupSchema)

export default ChemicalGroupModel