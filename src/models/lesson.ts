import mongoose, { Document, Schema } from 'mongoose';
import Course from './course';

interface Lesson extends Document {
    name: string;
    resourceType: 'video' | 'pdf' | 'article';
    thumbnailUrl: string;
    resourceUrl: string;
    courseId: mongoose.Types.ObjectId;
    courseTitle: string;
    article?: string;
}

const lessonSchema = new Schema<Lesson>({
    name: { type: String },
    resourceType: { type: String, enum: ['video', 'pdf', 'article'] },
    thumbnailUrl: { type: String},
    resourceUrl: { type: String },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: Course },
    courseTitle: { type: String },
    article: { type: String}
});

const Lesson = mongoose.model<Lesson>('Lesson', lessonSchema);
export default Lesson;
