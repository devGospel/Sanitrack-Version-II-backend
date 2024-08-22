import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from 'express';
import customResponse from "../../helpers/response";
import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import DiaryModel from "../../models/diary";
import { getDateInLosAngeles } from "../../utils/date";

const moduleName = "[diary/controller]";
const Logger = createChildLogger(moduleName);

const addDiary = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const {title, note} = req.body
    const userId = req.auth.userId

    const result = await DiaryModel.create({ 
        title: title, 
        note: note, 
        recordedBy: userId
    })

    return customResponse.successResponse('Diary added', result, res)
})

const getDiary = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query; // Dates received as query parameters

    // Regular expression to match the YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    let dateFilter = {};

    // Check if startDate and endDate are provided
    if (startDate && endDate) {
        if (!dateRegex.test(startDate as string) || !dateRegex.test(endDate as string)) {
            return customResponse.badRequestResponse('Dates must be in YYYY-MM-DD format', res);
        }

        // Convert received dates to Los Angeles timezone
        const start = getDateInLosAngeles(startDate as string);
        const end = getDateInLosAngeles(endDate as string);
        
        // Ensure 'end' includes the entire day if endDate is given as a date without time
        end.setHours(23, 59, 59, 999);
        
        dateFilter = {
            createdAt: {
                $gte: start,  // From the start of the start date
                $lte: end     // To the end of the end date
            }
        };
    }

    // Query to find diary entries, applying date filter if dates are provided
    const diaryEntries = await DiaryModel.find(dateFilter).populate('recordedBy').exec();

    return customResponse.successResponse('Diary result', diaryEntries, res);
});

export default{ 
    addDiary,
    getDiary
}