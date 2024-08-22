import { Request, Response } from "express";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import customResponse from "../../helpers/response";
import { AuthenticatedRequest } from "../../middlewares/security";
import { Logger } from "../../utils/logger";
import path from 'path'
import mongoose from 'mongoose';



const createLesson = async (
    req: any,
    res: Response
    ) => {
        try {
            const  courseId = req.params.courseId;
            let resourceUrl = '';
            let thumbnailUrl = '';

            if (!req.file) {
                return customResponse.badRequestResponse('You must upload the thumbnail and resource', res)
            }

            resourceUrl = req.file.location;
            

            const { name, resourceTypes, article} = req.body;
    
            // Check if the courseId is provided and valid
            const course = await Course.findById(courseId);
            if (!course) {
                return customResponse.notFoundResponse('Course not found', res);
            }
    
            // Create the lesson and associate it with the course
            const lesson = await Lesson.create({
                name,
                resourceTypes,
                thumbnailUrl: thumbnailUrl,
                resourceUrl: resourceUrl,
                courseId: courseId,
                courseTitle: course.title,
                article
            });
    
            return customResponse.createResponse('Lesson created successfully', lesson, res);
        } catch (err: any) {
            Logger.error(err);
            return customResponse.serverErrorResponse('Failed to create lesson', res, err);
        }
    }


const uploadThumbnail = async (req: any, res: Response) => {
    try {
        // Check if thumbnail file is uploaded
        if (!req.file) {
            return customResponse.badRequestResponse('You must upload the thumbnail', res);
        }

        // Access the location of the uploaded thumbnail file
        const thumbnailUrl = req.file.location;

        // Other logic for updating the lesson with the thumbnail URL
        // For example, you might update the lesson in the database
        const lessonId = req.params.lessonId; // Assuming lessonId is passed in the request params
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return customResponse.notFoundResponse('Lesson not found', res);
        }
        lesson.thumbnailUrl = thumbnailUrl;
        await lesson.save();

        return customResponse.successResponse('Thumbnail uploaded successfully', { thumbnailUrl }, res);
    } catch (err: any) {
        // Error handling
        return customResponse.serverErrorResponse('Failed to upload thumbnail', res, err);
    }
};



const getAllLessonsForCourse = async (
    req: AuthenticatedRequest,
    res: Response
    ) => {
    try {
        const courseId = req.params.courseId;
        const lessons = await Lesson.find({ courseId });
        if (!lessons || lessons.length === 0) {
            return customResponse.notFoundResponse('No lessons found for the course', res);
        }
        return customResponse.successResponse('Lessons retrieved successfully', lessons, res);
    } catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse('Failed to retrieve lessons', res, err);
    }
};

const getSingleLesson = async (
    req: AuthenticatedRequest,
    res: Response
    ) => {
        try {
            const lessonId = req.params.lessonId;
            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return customResponse.notFoundResponse('Lesson not found', res);
            }
            return customResponse.successResponse('Lesson found', lesson, res);
        } catch (err: any) {
        Logger.error(err);
        return customResponse.serverErrorResponse('Failed to fetch lesson', res, err);
    }
};

const updateLesson = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const lessonId = req.params.lessonId;
        const { name, resourceTypes, courseTitle, article } = req.body;
        let updatedLesson: Lesson | null;

        // Check if a file has been uploaded
        if (req.file) {
            // Update resourceUrl if a file has been uploaded
            const resourceUrl = req.file.path;
            updatedLesson = await Lesson.findByIdAndUpdate(
                lessonId,
                { name, resourceTypes, courseTitle, resourceUrl, article },
                { new: true }
            );
        } else {
            // If no file uploaded, update lesson without modifying resourceUrl
            updatedLesson = await Lesson.findByIdAndUpdate(
                lessonId,
                { name, resourceTypes, courseTitle, article },
                { new: true }
            );
        }

        // Check if the lesson was found and updated
        if (!updatedLesson) {
            return customResponse.notFoundResponse('Lesson not found', res);
        }

        // Return success response with updated lesson
        return customResponse.successResponse('Lesson updated successfully', updatedLesson, res);
    } catch (err: any) {
        Logger.error(err);
        return customResponse.serverErrorResponse('Failed to update lesson', res, err);
    }
};


const deleteLesson = async (
    req: AuthenticatedRequest,
    res: Response
    ) => {
        try {
            const lessonId = req.params.lessonId;
            const deletedLesson = await Lesson.findByIdAndDelete(lessonId);
            if (!deletedLesson) {
                return customResponse.notFoundResponse('Lesson not found', res);
            }
            return customResponse.successResponse('Lesson deleted successfully', null, res);
        } catch (err: any) {
            Logger.error(err);
            return customResponse.serverErrorResponse('Failed to delete lesson', res, err);
        }
};


export default {
    createLesson,
    uploadThumbnail,
    getAllLessonsForCourse,
    getSingleLesson,
    updateLesson,
    deleteLesson
}