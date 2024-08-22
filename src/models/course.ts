import mongoose, { Document, Schema } from 'mongoose';
import User from './user';

// Define an interface for the Course document
interface Course extends Document {
  thumbnailUrl: string;
  title: string;
  description: string;
  level: string;
  group: string;
  published: boolean;
  publicationDate?: Date;
  adminId: mongoose.Types.ObjectId;
  authorName: string;
}

// Define the schema for the Course document
const courseSchema = new Schema<Course>({
  thumbnailUrl: { type: String},
  title: { type: String},
  description: { type: String},
  level: { type: String},
  group: { type: String},
  published: { type: Boolean, default: false },
  publicationDate: { type: Date },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: User}, 
  authorName: { type: String}
});

// Create and export the Course model
const Course = mongoose.model<Course>('Course', courseSchema);
export default Course;