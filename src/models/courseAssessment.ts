import mongoose, { Document, Schema } from 'mongoose';
import Course from './course';
import AssessmentQuestion from './courseAssessmentQuestions';

interface Assessment extends Document {
    questions: string[]; // Reference to AssessmentQuestion documents
    thirdPartyUrl?: string;
    pdfUrl?: string;
    courseId?: mongoose.Types.ObjectId;
}

const assessmentSchema = new Schema<Assessment>({
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: AssessmentQuestion }], // Reference to AssessmentQuestion documents
    thirdPartyUrl: { type: String },
    pdfUrl: { type: String },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: Course }
});

const Assessment = mongoose.model<Assessment>('Assessment', assessmentSchema);
export default Assessment;