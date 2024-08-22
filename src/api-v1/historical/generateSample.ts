import { faker } from "@faker-js/faker";
import path from "path"
import TeamModel, { Team } from "../../models/teams";
import UserRoles from "../../models/userRoles";
import AssetTaskType from "../../models/roomDetailCleaning";

const ExcelJS = require('exceljs');

export const generateSampleData = async () => {
    try{ 
        // Fetch data from the database
        const cleaners:any = await UserRoles.find({role_name: "Cleaner"}); 
        const inspectors:any = await UserRoles.find({role_name: "Inspector"}); 
        const teams:any = await TeamModel.find(); 

        const assetTaskType:any = await AssetTaskType.find()

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('WorkOrders');

        // Define columns
        worksheet.columns = [
            { header: 'workOrderName', key: 'workOrderName' },
            { header: 'teamName', key: 'teamName' },
            { header: 'cleaner', key: 'cleaner' },
            { header: 'inspector', key: 'inspector' },
            { header: 'validCleaningPeriod', key: 'validCleaningPeriod' },
            { header: 'startHour', key: 'startHour' },
            { header: 'startDate', key: 'startDate' },
            { header: 'endDate', key: 'endDate' },
            { header: 'roomName', key: 'roomName' },
            { header: 'assetName', key: 'assetName' },
            { header: 'assetTaskType', key: 'assetTaskType' },
        ];

        // Generate dummy data
        for (let i = 0; i < 100; i++) {
            const startDate = faker.date.past(0.4);  // Last 4 months
            const endDate = faker.date.future(0.5, startDate);  // Up to 6 months in future
            const randomAssetTask = assetTaskType[Math.floor(Math.random() * assetTaskType.length)];  // Select a random room

            worksheet.addRow({
                workOrderName: `workOrder[${startDate.toISOString().split('T')[0]}]`,
                teamName: teams[Math.floor(Math.random() * teams.length)]._id,
                cleaner: Math.random() > 0.5 ? cleaners[Math.floor(Math.random() * cleaners.length)].user_id : "",
                inspector: Math.random() > 0.5 ? inspectors[Math.floor(Math.random() * inspectors.length)].user_id : "",
                validCleaningPeriod: Math.ceil(Math.random() * 9),
                startHour: Math.ceil(Math.random() * 4) + 7,  // Between 8 and 11
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                roomName: randomAssetTask.roomId,
                assetName: randomAssetTask.assetId,
                assetTaskType: randomAssetTask._id
            });
        }
        return workbook  
    }catch(error: any){ 
        throw new Error('Something happened while generating data')
    }
   
}
