import { Request, Response } from 'express';
import Assessment from '../../models/courseAssessment';
import AssessmentQuestion from '../../models/courseAssessmentQuestions';
import customResponse from "../../helpers/response";
import { AuthenticatedRequest } from "../../middlewares/security";
import {Logger} from '../../utils/logger';

const addAssessmentQuestion = async (
    req: AuthenticatedRequest,
    res: Response
    ) => {
    try {
        const { question, option1, option2, option3, option4, correctAnswer, courseId } = req.body;

        // Validate required fields
        /*if (!question || !option1 || !option2 || !option3 || !option4 || !correctAnswer || !courseId) {
            return customResponse.badRequestResponse('Missing required fields', res);
        }*/

        const optionsArray = [option1, option2, option3, option4]

        const newQuestion = new AssessmentQuestion({
            question: question,
            options: optionsArray,
            correctAnswer: correctAnswer
        })

        const savedQuestion = await newQuestion.save()

        // Find the assessment by courseId
        let assessment = await Assessment.findOne({ courseId });

        // If assessment doesn't exist, create a new one
        if (!assessment) {
            assessment = new Assessment({ courseId, questions: [] });
        }

        // Add the new question to the assessment's questions array
        assessment.questions.push(savedQuestion._id);

        // Save the assessment
        await assessment.save();

        return customResponse.createResponse('Assessment question added successfully', newQuestion, res);
    } catch (err: any) {
        Logger.error(err);
        return customResponse.serverErrorResponse('Failed to add assessment question', res, err);
    }
};

const getAllAssessmentQuestionsForCourse = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const courseId = req.params.courseId;

        // Find the assessment for the given course
        const assessment = await Assessment.findOne({ courseId }).populate('questions');

        // If assessment doesn't exist, return not found
        if (!assessment) {
            return customResponse.notFoundResponse('Assessment not found for the course', res);
        }

        // Return all questions for the assessment
        return customResponse.successResponse('Assessment questions retrieved successfully', assessment.questions, res);
    } catch (err: any) {
        Logger.error(err);
        return customResponse.serverErrorResponse('Failed to retrieve assessment questions', res, err);
    }
};

const getSingleAssessmentQuestion = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const questionId = req.params.questionId;

        // Find the question by its ID
        const question = await AssessmentQuestion.findById(questionId);

        // If question doesn't exist, return not found
        if (!question) {
            return customResponse.notFoundResponse('Assessment question not found', res);
        }

        // Return the question
        return customResponse.successResponse('Assessment question retrieved successfully', question, res);
    } catch (err: any) {
        Logger.error(err);
        return customResponse.serverErrorResponse('Failed to fetch assessment question', res, err);
    }
};

const updateAssessmentQuestion = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        //const { questionId, question, options, correctAnswer } = req.body;
        const { question, option1, option2, option3, option4, correctAnswer, questionId} = req.body;

        // Validate required fields
        /*if (!questionId || !question || !option1 || !option2 || !option3 || !option4 || !correctAnswer) {
            return customResponse.badRequestResponse('Missing required fields', res);
        }*/

        // Find the question by ID and update it
        const updatedQuestion = await AssessmentQuestion.findByIdAndUpdate(questionId, { question, option1, option2, option3, option4, correctAnswer }, { new: true });

        // If question doesn't exist, return not found
        if (!updatedQuestion) {
            return customResponse.notFoundResponse('Assessment question not found', res);
        }

        // Return the updated question
        return customResponse.successResponse('Assessment question updated successfully', updatedQuestion, res);
    } catch (err: any) {
        Logger.error(err);
        return customResponse.serverErrorResponse('Failed to update assessment question', res, err);
    }
};

const deleteAssessmentQuestion = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const { questionId } = req.body

        // Delete the question by its ID
        const deletedQuestion = await AssessmentQuestion.findByIdAndDelete(questionId);

        // If question doesn't exist, return not found
        if (!deletedQuestion) {
            return customResponse.notFoundResponse('Assessment question not found', res);
        }

        // Remove the question reference from assessments
        await Assessment.updateMany({ $pull: { questions: questionId } });

        return customResponse.successResponse('Assessment question deleted successfully', null, res);
    } catch (err: any) {
        Logger.error(err);
        return customResponse.serverErrorResponse('Failed to delete assessment question', res, err);
    }
};

export default {
    addAssessmentQuestion,
    getAllAssessmentQuestionsForCourse,
    getSingleAssessmentQuestion,
    updateAssessmentQuestion,
    deleteAssessmentQuestion
};
