import { Request, Response, NextFunction } from "express";
import Course from "../../models/course";
import customResponse from "../../helpers/response";
import { AuthenticatedRequest } from "../../middlewares/security";
import User from "../../models/user";
import path from 'path'

import { createChildLogger } from "../../utils/childLogger";

const moduleName = '[course/controller]'
const Logger = createChildLogger(moduleName)
/**
 * Create a new course with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */

const createCourse = async (
    req: any,
    res: Response,
    next: any
) => {
    try {
        // Assign user id from request auth
        const adminId = req.auth.userId;

        let thumbnailUrl = '';

        if (!req.file) {
            return customResponse.badRequestResponse('You must upload a course thumbnail', res)
        }

        thumbnailUrl = req.file.location;
        // Destructure required fields from request body
        const {
            title,
            description,
            level,
            group,
            published,
            publicationDate,
            authorName,
        } = req.body;

    

        // Obtain thumbnail url

        const course = new Course({
            thumbnailUrl: thumbnailUrl,
            title: title,
            description: description,
            level: level,
            group: group,
            published,
            publicationDate,
            adminId: adminId,
            authorName: authorName
        })

        const savedCourse = await course.save()
        // Return success response
        return customResponse.createResponse("Course created successfully", savedCourse, res);

    } catch (err:any) {
        // Log error
        Logger.error(err);
        // Return server error response
        return customResponse.serverErrorResponse("Ouch! Course Creation failed", res, err);
    }
};

/**
 * Get all courses.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with the list of courses or error message
 */
const getAllCourses = async (
    req : AuthenticatedRequest,
    res: Response
    ) => {
    try {
        // Fetch all courses from the database
        const courses = await Course.find();

        // Return the list of courses as a success response
        return customResponse.successResponse("Courses retrieved successfully", courses, res);
    } catch (err: any) {
        // Log the error and return a server error response
        Logger.error(err);
        return customResponse.serverErrorResponse("Failed to fetch courses", res, err);
    }
};


/**
 * Update an existing course.
 * @param req - Express Request object containing the updated course data
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const updateCourse = async (
    req : any,
    res: Response
    ) => {
    try {
        // Extract the course ID from the request parameters
        const courseId = req.params.id;

        // Fetch the existing course from the database
        let course = await Course.findById(courseId);

        // If the course is not found, return a not found response
        if (!course) {
            return customResponse.notFoundResponse("Course not found", res);
        }

        // Update the course fields with the new data from the request body
        course.set(req.body);

        // If there is a file attached in the request, update the course's thumbnailUrl
        if (req.file) {
            course.thumbnailUrl = req.file.location;
        }

        // Save the updated course to the database
        course = await course.save();

        // Return a success response with the updated course details
        return customResponse.successResponse("Course updated successfully", course, res);
    } catch (err: any) {
        // Log the error and return a server error response
        Logger.error(err);
        return customResponse.serverErrorResponse("Failed to update course", res, err);
    }
};


/**
 * Delete a course by ID.
 * @param req - Express Request object containing the course ID
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const deleteCourse = async (
    req : AuthenticatedRequest,
    res: Response
    ) => {
    try {
        // Extract the course ID from the request parameters
        const courseId = req.params.id;

        // Find the course by ID and delete it
        const deletedCourse = await Course.findByIdAndDelete(courseId);

        // If the course is not found, return a not found response
        if (!deletedCourse) {
            return customResponse.notFoundResponse("Course not found", res);
        }

        // Return a success response with the deleted course details
        return customResponse.successResponse("Course deleted successfully", deletedCourse, res);
    } catch (err: any) {
        // Log the error and return a server error response
        Logger.error(err);
        return customResponse.serverErrorResponse("Failed to delete course", res, err);
    }
};


/**
 * Publish a course by setting its 'published' field to true.
 * @param req - Express Request object containing the course ID
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const publishCourse = async (
    req : AuthenticatedRequest,
    res: Response
    ) => {
    try {
        // Extract the course ID from the request parameters
        const courseId = req.params.id;

        // Find the course by ID and update its 'published' field to true
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { published: true },
            { new: true } // Return the updated document
        );

        // If the course is not found, return a not found response
        if (!updatedCourse) {
            return customResponse.notFoundResponse("Course not found", res);
        }

        // Return a success response with the updated course details
        return customResponse.successResponse("Course published successfully", updatedCourse, res);
    } catch (err: any) {
        // Log the error and return a server error response
        Logger.error(err);
        return customResponse.serverErrorResponse("Failed to publish course", res, err);
    }
};


/**
 * Unpublish a course by setting its 'published' field to false.
 * @param req - Express Request object containing the course ID
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const unpublishCourse = async (
    req : AuthenticatedRequest,
    res: Response
    ) => {
    try {
        // Extract the course ID from the request parameters
        const courseId = req.params.id;

        // Find the course by ID and update its 'published' field to false
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { published: false },
            { new: true } // Return the updated document
        );

        // If the course is not found, return a not found response
        if (!updatedCourse) {
            return customResponse.notFoundResponse("Course not found", res);
        }

        // Return a success response with the updated course details
        return customResponse.successResponse("Course unpublished successfully", updatedCourse, res);
    } catch (err: any) {
        // Log the error and return a server error response
        Logger.error(err);
        return customResponse.serverErrorResponse("Failed to unpublish course", res, err);
    }
};


/**
 * Get all published courses.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with published courses or error message
 */
const getPublishedCourses = async (
    req : AuthenticatedRequest,
    res: Response
    )=> {
    try {
        // Find all courses with 'published' set to true
        const publishedCourses = await Course.find({ published: true });

        // Return the list of published courses
        return customResponse.successResponse("Published courses retrieved successfully", publishedCourses, res);
    } catch (err: any) {
        // Log the error and return a server error response
        Logger.error(err);
        return customResponse.serverErrorResponse("Failed to retrieve published courses", res, err);
    }
};


export default {
    createCourse,
    getAllCourses,
    updateCourse,
    deleteCourse,
    publishCourse,
    unpublishCourse,
    getPublishedCourses
}