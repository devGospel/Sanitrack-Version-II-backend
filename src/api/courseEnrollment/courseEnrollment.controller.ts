import { Request, Response } from 'express';
import EnrollmentModel from '../../models/courseEnrollment';
import User from '../../models/user';
import Course from '../../models/course';
import customResponse from "../../helpers/response";
import { AuthenticatedRequest } from "../../middlewares/security";
import { Logger } from '../../utils/logger';

export const enrollUserInCourse = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId, courseId } = req.body;

        // Check if the user and course exist
        const user = await User.findById(userId);
        const course = await Course.findById(courseId);
        if (!user || !course) {
            return customResponse.notFoundResponse('User or course not found', res);
        }

        // Check if the user is already enrolled in the course
        const existingEnrollment = await EnrollmentModel.findOne({ user: userId, course: courseId });
        if (existingEnrollment) {
            return customResponse.badRequestResponse('User is already enrolled in the course', res);
        }

        // Create a new enrollment
        const newEnrollment = await EnrollmentModel.create({ user: userId, course: courseId, enrollmentDate: new Date() });
        
        return customResponse.createResponse('User enrolled in the course successfully', newEnrollment, res);
    } catch (error: any) {
        Logger.error('Error enrolling user in course:', error);
        return customResponse.serverErrorResponse('Internal server error', res, error);
    }
};


export const getAllEnrolledCourses = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        
        // Find all enrollments for the user
        const enrollments = await EnrollmentModel.find({ user: userId });
        
        // Extract course IDs from enrollments
        const enrolledCourseIds = enrollments.map(enrollment => enrollment.course);

        // Fetch course details based on course IDs
        const enrolledCourses = await Course.find({ _id: { $in: enrolledCourseIds } });

        return customResponse.successResponse('Enrolled courses retrieved successfully', enrolledCourses, res);
    } catch (error: any) {
        Logger.error('Error fetching enrolled courses:', error);
        return customResponse.serverErrorResponse('Internal server error', res, error);
    }
};


export default {
    enrollUserInCourse,
    getAllEnrolledCourses
}