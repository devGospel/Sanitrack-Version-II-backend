import mongoose, { Document, Schema, model, Types } from 'mongoose';
import Location from './location';

// Define interface for room
interface File extends Document {
  
  location_id: mongoose.Types.ObjectId;
  title: String; 
  pdf: String
}

// Create a Mongoose schema for Room
const fileSchema = new Schema<File>({
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: Location, required: true },
  title: {type: String, required: true},
  pdf: {type: String, required: true}, 
});

// Create a Mongoose model for Room
const DocumentModel = model<File>('files', fileSchema);

export default DocumentModel;
