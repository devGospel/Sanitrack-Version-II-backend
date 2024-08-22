import mongoose, { Document, Schema } from 'mongoose';

interface AssessmentQuestion extends Document {
    question: string;
    options: string[];
    correctAnswer: number; // Index of correct answer in options array
}

const assessmentQuestionSchema = new Schema<AssessmentQuestion>({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }
});

const AssessmentQuestion = mongoose.model<AssessmentQuestion>('AssessmentQuestion', assessmentQuestionSchema);
export default AssessmentQuestion;