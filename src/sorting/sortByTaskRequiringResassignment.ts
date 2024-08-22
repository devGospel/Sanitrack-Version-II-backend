import TaskModel from "../models/task";
import { createChildLogger } from "../utils/childLogger";

const moduleName = '[sortTask]'
const Logger = createChildLogger(moduleName)

export const sortTaskByResassignment = async (start_date: Date, end_date: Date) => {
    try {
        const query: any = {
            isSubmitted: false,
            'tasks.isDone': true
        };

        if (start_date && end_date) {
            query.date_added = { $gte: start_date, $lte: end_date };
        }
        
        const tasks = await TaskModel.find(query);
        Logger.info(tasks);
        
        return {
            data: tasks
        };
    } catch (error: any) {
        Logger.error('An error occurred when getting the tasks that need reassignment');
        return {
            status: false,
            message: 'Something went wrong when getting the tasks that need to be reassigned'
        };
    }
};
