import mongoose, { Document, Schema } from 'mongoose';
import User from './user';
import Course from './course';

interface Enrollment extends Document {
    user: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    enrolledAt: Date;
    completedAt?: Date; 
}

const enrollmentSchema = new Schema<Enrollment>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: User },
    course: { type: mongoose.Schema.Types.ObjectId, ref: Course },
    enrolledAt: { type: Date, default: Date.now() },
    completedAt: { type: Date }
});

const EnrollmentModel = mongoose.model<Enrollment>('Enrollment', enrollmentSchema);
export default EnrollmentModel;