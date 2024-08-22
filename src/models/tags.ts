// This is the actual time taken to clean a facility/room
import mongoose, { Document, Schema } from 'mongoose';


interface tag extends Document{ 
    name: string
}

const tagSchema = new Schema<tag>({ 
    name: {type: String, unique: true, required: true}
})

const TagModel = mongoose.model<tag>('tags', tagSchema)

export default TagModel