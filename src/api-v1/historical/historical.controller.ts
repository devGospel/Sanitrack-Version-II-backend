import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import customResponse from "../../helpers/response";
import mongoose, { Error as MongooseError } from 'mongoose';
import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import xlsx from "xlsx"
import Address from "../../models/address";
import User from "../../models/user";
import UserRoles from "../../models/userRoles";
import Role from "../../models/role";
import { MongoServerError } from "mongodb";
import TeamModel from "../../models/teams";
import { generateSampleData } from "./generateSample";
import WorkOrderModel from "../../models/workorder";
import WorkOrderScheduleModel from "../../models/workOrderSchedule";
import WorkOrderAssigneeModel from "../../models/workOrderAssignee";
import AssetTaskType from "../../models/roomDetailCleaning";
import FrequencyModel from "../../models/frequency";
import { generateScheduledDates } from "../../utils/date";
import WorkOrderTaskModel from "../../models/workOrderTasks";
import workOrderAssetTaskModel from "../../models/workOrderAssetTask";
// import { Logger } from "../../utils/logger";
import Excel = require('exceljs')
import Stream from "stream"
const ExcelJS = require('exceljs');
const moduleName = "[historical data v1/controller]";
const Logger = createChildLogger(moduleName);

const uploadCleaner = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const document = req.file as Express.Multer.File
    
    const {staffType} = req.body
    if(!staffType){
        return customResponse.badRequestResponse('Staff type is required', res)
    }

    const validCleanerId = await Role.findOne({role_name: "Cleaner"})
    if(!validCleanerId){ 
        return customResponse.createResponse('Contact admin to create a cleaner role before proceeding', {}, res)
    }
    const cleanerRole = validCleanerId._id

    const validInspectorId = await Role.findOne({role_name: "Inspector"})
    if(!validInspectorId){ 
        return customResponse.createResponse('Contact admin to create a inspector role before proceeding', {}, res)
    }
    const inspectorRole = validInspectorId._id

    if(!document){ 
        return customResponse.badRequestResponse('Document not uploaded', res)
    }

    const workBook:Excel.Workbook = new ExcelJS.Workbook(document.buffer)

    try{
        await workBook.xlsx.load(document.buffer)

        for(const sheet of workBook.worksheets){
            let isFirstRow = true
            const rowPromises: Promise<void>[] = [];

            sheet.eachRow(async (row, rowNumber) => { 
                if(isFirstRow){ 
                    isFirstRow = false
                    return
                }

                rowPromises.push((async () => {
                    // get address data, country, state, city, home_address
                    const countryName = row.getCell(5)
                    const stateName = row.getCell(6)
                    const cityName = row.getCell(7)
                    const homeAddressName = row.getCell(8)

                    const addressData = { 
                        country: countryName.text,
                        state: stateName.text,
                        city: cityName.text, 
                        home_address: homeAddressName.text
                    }

                    const address = new Address(addressData)
                    await address.save()

                    // get username, email, phone_number 
                    const userName = row.getCell(1)
                    const passwordName = row.getCell(2)
                    const emailName = row.getCell(3)
                    const phoneNumberName = row.getCell(4)

                    const userData = {
                        username: userName.text,
                        password: passwordName.text,
                        email: emailName.text,
                        address_id: address._id, // Reference to the address document
                        phone_number: phoneNumberName.text
                    };
                    const user = new User(userData)
                    await user.save()

                    const userRoleData = { 
                        user_id: user._id, 
                        user_name: user.username, 
                        role_id: staffType == "Cleaner" ?  cleanerRole : inspectorRole, 
                        role_name: staffType == "Cleaner" ? "Cleaner" : "Inspector"
                    }
                    const userRole = new UserRoles(userRoleData)
                    await userRole.save()
                })())
            })
            await Promise.all(rowPromises)
        }
        return customResponse.successResponse('Staff document uploaded', {},res)
    }catch(error: any){ 
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred while processing a row in the upload staff', res, error)
    }
   
})


const autoGenerateTeams = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const MAX_CLEANERS_PER_TEAM = 10;
    const MAX_INSPECTORS_PER_TEAM = 2;

    const validCleanerId = await Role.findOne({role_name: "Cleaner"})
    if(!validCleanerId){ 
        return customResponse.createResponse('Contact admin to create a cleaner role before proceeding', {}, res)
    }
    const cleanerRole = validCleanerId._id

    const validInspectorId = await Role.findOne({role_name: "Inspector"})
    if(!validInspectorId){ 
        return customResponse.createResponse('Contact admin to create a inspector role before proceeding', {}, res)
    }
    const inspectorRole = validInspectorId._id

    const today = new Date();

    // Fetch available cleaners and inspectors
    const cleaners = await UserRoles.find({ role_id: cleanerRole }); 
    const inspectors = await UserRoles.find({ role_id: inspectorRole });

    // Shuffle the arrays for random selection
    const shuffledCleaners = cleaners.sort(() => 0.5 - Math.random());
    const shuffledInspectors = inspectors.sort(() => 0.5 - Math.random());

    // get all the teams 
    const teamsCount = await TeamModel.countDocuments()
    let teamCounter = teamsCount;
    const createdTeams = [];
    // console.log(shuffledCleaners)

    while (shuffledCleaners.length > 0 && shuffledInspectors.length > 0) {
        const teamName = `Team-${teamCounter}`
        const members = [];

        // Select inspectors for the team
        for (let i = 0; i < MAX_INSPECTORS_PER_TEAM && shuffledInspectors.length > 0; i++) {
            const inspector = shuffledInspectors.pop();
            members.push({ userId: inspector?.user_id, roleId: inspector?.role_id });
        }

        // Select cleaners for the team
        for (let j = 0; j < MAX_CLEANERS_PER_TEAM && shuffledCleaners.length > 0; j++) {
            const cleaner = shuffledCleaners.pop();
            members.push({ userId: cleaner?.user_id, roleId: cleaner?.role_id });
        }

        // Save the team to the database
        const newTeam = new TeamModel({ teamName: teamName.toLowerCase(), members, dateCreated: today });
        await newTeam.save();

        createdTeams.push(newTeam);
        teamCounter++
    }

    if (createdTeams.length === 0) {
        return customResponse.badRequestResponse('Insufficient members to create any teams.', res);
    }

    return customResponse.successResponse('Teams auto-generated successfully', createdTeams, res);
})

const generateWorkOrderSample = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    try{
        const workbook =  await generateSampleData()
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=WorkOrder_Sample_Data_100.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    }catch(error:any){ 
        return customResponse.serverErrorResponse('Something went wrong while downloading sample', res, error)
    }
   
})

const uploadSampleWorkOrder = catchAsync(async(req:AuthenticatedRequest, res:Response) => {
    const document = req.file as Express.Multer.File
    if(!document){ 
        return customResponse.badRequestResponse('Document not uploaded', res)
    }

    const BATCH_SIZE = 2;

    const workBook = xlsx.read(document.buffer, {type: "buffer"})
    const sheetName = workBook.SheetNames[0]
    const sheet = workBook.Sheets[sheetName]

    // convert to json 
    const rows:any = xlsx.utils.sheet_to_json(sheet)

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const tasks = [];
        for(const row of batch){ 
            try{ 
                // create workorder for row 
                const workOrderData = {
                    name: row.workOrderName
                }
                const newWorkOrder = new WorkOrderModel(workOrderData)
                await newWorkOrder.save()

                // format the start date: 
                const defaultStartDate = new Date(row.startDate);
                defaultStartDate.setHours(row.startHour);
                const finalStartDate = defaultStartDate;

                console.log(`the final start date is => ${finalStartDate}`)
                // create work order schedule 
                const workOrderScheduleData = { 
                    workOrderId: newWorkOrder._id,
                    cleaningValidPeriod: row.validCleaningPeriod,
                    startHour: row.startHour, 
                    startDate: finalStartDate,
                    endDate: row.endDate
                }
                const newWorkOrderSchedule = new WorkOrderScheduleModel(workOrderScheduleData)
                await newWorkOrderSchedule.save()

                // if the teamName/cleaner/inspectore is present, generate the workOrderAssignee model
                //  get the id and then fetch the data by doing TeamModel.findById
                // get the memebers and seperate by the roleId by checking UserRole.
                // do the same for cleaner and inspector but make use of sets and store in a variable such as finalCleaner and finalInspector
                // Proceed to update the workOrderAssignee using the workOrderId
                // Handle team, cleaner, and inspector assignments

                let finalCleaner:string[] = []
                let finalInspector:string[] = []
                

                let teamId = null
                // Validate the cleaned ID to ensure it's 24 characters long
                if (row.teamName) {
                    // Remove any extraneous characters like quotes or whitespace
                    const cleanTeamId = row.teamName.replace(/['"]/g, '').trim();
                
                    // Validate the cleaned ID to ensure it's 24 characters long
                    if (mongoose.Types.ObjectId.isValid(cleanTeamId)) {
                        try {
                            teamId = new mongoose.Types.ObjectId(cleanTeamId);
                            const team = await TeamModel.findById(teamId).populate('members.roleId');
                            
                            if (team) {
                                team.members.forEach(member => {
                                    if (member.roleId && member.roleId.role_name === "Inspector") {
                                        finalInspector.push(member.userId.toString());
                                    } else if (member.roleId && member.roleId.role_name === "Cleaner") {
                                        finalCleaner.push(member.userId.toString());
                                    }
                                });
                            } else {
                                Logger.warn(`Team with ID ${cleanTeamId} not found.`);
                            }
                        } catch (error) {
                            Logger.error(`Error fetching team with ID ${cleanTeamId}`, error);
                        }
                    } else {
                        Logger.error(`Invalid ObjectId: ${cleanTeamId}`);
                    }
                } else {
                    Logger.warn('No team ID provided.');
                }
                
                if (row.cleaner) {
                    const cleaners = row.cleaner.split(','); // Assuming multiple cleaners are comma-separated
                    for (const cleanerName of cleaners) {
                        const cleanCleanerId = cleanerName.replace(/['"]/g, '').trim();
                        const cleanerId = new mongoose.Types.ObjectId(cleanCleanerId);

                        const cleaner = await User.findById(cleanerId);
                        // Logger.info(`cleaner found => ${cleaner}`)
                        if (cleaner) {
                            finalCleaner.push(cleaner._id);
                        }
                    }
                }

                if (row.inspector) {
                    const inspectors = row.inspector.split(','); // Assuming multiple inspectors are comma-separated
                    for (const inspectorName of inspectors) {
                        const cleanInspectorId = inspectorName.replace(/['"]/g, '').trim();
                        const inspectorId = new mongoose.Types.ObjectId(cleanInspectorId);

                        const inspector = await User.findById(inspectorId);
                        // Logger.info(`inspector found => ${inspector}`)
                        if (inspector) {
                            finalInspector.push(inspector._id);
                        }
                    }
                }

                // create the unique cleaner
                const uniqueCleaners = Array.from(new Set(finalCleaner));
                const uniqueInspectors = Array.from(new Set(finalInspector));

                // Logger.info(`the team id => ${teamId}`)
                const workOrderAssigneeData = { 
                    workOrderId: newWorkOrder._id,
                    team: teamId, 
                    cleaner: uniqueCleaners, 
                    inspector: uniqueInspectors
                }
                const newWorkOrderAssignee = new WorkOrderAssigneeModel(workOrderAssigneeData)
                await newWorkOrderAssignee.save()

                // proceed to generate task for the assetTaskType
                const cleanAssetTaskId = row.assetTaskType.replace(/['"]/g, '').trim();
                const assetTaskId = new mongoose.Types.ObjectId(cleanAssetTaskId);

                const cleanAssetId = row.assetName.replace(/['"]/g, '').trim()
                const assetId = new mongoose.Types.ObjectId(cleanAssetId)

                const cleanRoomId = row.roomName.replace(/['"]/g, '').trim()
                const roomId = new mongoose.Types.ObjectId(cleanRoomId)

                const assetTaskDetails:any = await AssetTaskType.findById(assetTaskId).populate({
                    path: 'cleaningTypeFrequency', 
                    model: FrequencyModel
                })

                // update the AssetTaskType mss active to true 
                await AssetTaskType.findByIdAndUpdate(assetTaskId, {mssActive: true}, {new:true})

                // Logger.info(`asset task details => ${assetTaskDetails}`)

                const scheduledDates = generateScheduledDates(finalStartDate, row.endDate, assetTaskDetails?.cleaningTypeFrequency?.availableInterval, assetTaskDetails?.cleaningTypeFrequency?.interval, assetTaskDetails?.cleaningTypeFrequency?.excludeWeekend, assetTaskDetails?.cleaningTypeFrequency?.unit, assetTaskDetails?.cleaningTypeFrequency?.validStartHour, assetTaskDetails?.cleaningTypeFrequency?.validStopHour )

                // console.log(`the scheduled dates are => ${scheduledDates}`)

                for(let i = 0; i< scheduledDates.length; i++){ 
                    const validCleaningTime = new Date(scheduledDates[i])
                    validCleaningTime.setHours(validCleaningTime.getHours() + (row.validCleaningPeriod) as number)
                    
                    tasks.push({
                        workOrderId: newWorkOrder._id, 
                        assetId: assetId, 
                        assetTaskType: assetTaskId,
                        roomId: roomId, 
                        scheduledDate: scheduledDates[i],
                        validCleaningPeriod: validCleaningTime, 
                        exclude: false, 
                        isDone: false, 
                        isApproved: false
                    })
                    // console.log(`tasks => ${tasks}`)
                }
                if(tasks.length){ 
                    await WorkOrderTaskModel.insertMany(tasks)
                }
               

                // insert into the workOrderAssetTask 
                await workOrderAssetTaskModel.create({ 
                    workOrderId: newWorkOrder._id, 
                    assetTask: assetTaskId
                })
                Logger.info(`next ====> `)
            }catch(error){ 
                Logger.error('Something went wrong', error)
            }
        }
    }
    return customResponse.successResponse('Document uploaded', {}, res)
})

const uploadSampleStreamed = catchAsync(async (req: AuthenticatedRequest, res: Response) => { 
    const document = req.file as Express.Multer.File;
    if (!document) { 
        return customResponse.badRequestResponse('Document not uploaded', res);
    }

    const workbook: Excel.Workbook = new ExcelJS.Workbook();
    let tasks: any[] = []; // To hold work order tasks for batch insertion
    const CONCURRENCY_LIMIT = 2
    const BATCH_SIZE = 2000; // Define an appropriate batch size

    try {
        await workbook.xlsx.load(document.buffer); // Load the workbook
        const sheet = workbook.worksheets[0]

        let isFirstRow = true; // Flag to check the first row
        let rowPromises: Promise<void>[] = [];

        const rowCount = sheet.rowCount
        console.log(`total number of rows ${rowCount}`)
        for(let rowNumber = 2; rowNumber <= rowCount-1; rowNumber++){
            console.log(`--------------------------Starting ${rowNumber}-------------------`)
            const row = sheet.getRow(rowNumber)
            
            const rowAssetTaskId = row.getCell(11).text;
            const cleanAssetTaskId = rowAssetTaskId.replace(/['"]/g, '').trim();
            const assetTaskId = new mongoose.Types.ObjectId(cleanAssetTaskId);

            const assetTaskDetails: any = await AssetTaskType.findById(assetTaskId).populate({
                path: 'cleaningTypeFrequency', 
                model: FrequencyModel
            });

            if(!assetTaskDetails){
                continue
            }
            if((assetTaskDetails.cleaningTypeFrequency.availableInterval == undefined) || (assetTaskDetails.cleaningTypeFrequency.interval == undefined) || (assetTaskDetails.cleaningTypeFrequency.excludeWeekend == undefined)){ 
                console.log(`Skipping row ${rowNumber} due to invalid assetTaskDetails`);
                continue;
            }
            console.log(`--------------------------Frequency check for ${rowNumber}-------------------`)
            

            // Collect promise for each row processing

            // get the workOrderName
            const workOrderName = row.getCell(1);
            const workOrderData = {
                name: workOrderName.text
            };

            const newWorkOrder = new WorkOrderModel(workOrderData);
            await newWorkOrder.save();

            console.log(`-----------Added work order for ${rowNumber}-------------------------`)

            // get schedule details
            const rowStartDate = row.getCell(7).text;
            const rowStartHour = row.getCell(6).text;
            const rowCleaningValidPeriod = row.getCell(5).text;
            const rowEndDate = row.getCell(8).text;

            const defaultStartDate = new Date(rowStartDate);
            const hours = Number(rowStartHour);
            defaultStartDate.setHours(hours);
            const finalStartDate = defaultStartDate;
            const finalEndDate = new Date(rowEndDate);

            // create the work order schedule
            const workOrderScheduleData = { 
                workOrderId: newWorkOrder._id,
                cleaningValidPeriod: Number(rowCleaningValidPeriod), 
                startHour: Number(rowStartHour), 
                startDate: finalStartDate,
                endDate: finalEndDate
            };

            const newWorkOrderSchedule = new WorkOrderScheduleModel(workOrderScheduleData);
            await newWorkOrderSchedule.save();

            console.log(`-----------Added work schedule for ${rowNumber}-------------------------`)

            // start processing work Order Assignee
            let finalCleaner: string[] = [];
            let finalInspector: string[] = [];
            let teamId = null;

            const rowTeamId = row.getCell(2).text;
            const rowCleanerId = row.getCell(3).text;
            const rowInspectorId = row.getCell(4).text;

            if (rowTeamId !== "") { 
                const cleanTeamId = rowTeamId.replace(/['"]/g, '').trim();
                if (mongoose.Types.ObjectId.isValid(cleanTeamId)) { 
                    teamId = new mongoose.Types.ObjectId(cleanTeamId);
                    const team = await TeamModel.findById(teamId).populate('members.roleId');

                    if (team) {
                        team.members.forEach(member => {
                            if (member.roleId && member.roleId.role_name === "Inspector") {
                                finalInspector.push(member.userId.toString());
                            } else if (member.roleId && member.roleId.role_name === "Cleaner") {
                                finalCleaner.push(member.userId.toString());
                            }
                        });
                    }
                }
            }

            if (rowCleanerId !== "") { 
                const cleaners = rowCleanerId.split(',');
                for (const cleanerName of cleaners) {
                    const cleanCleanerId = cleanerName.replace(/['"]/g, '').trim();
                    const cleanerId = new mongoose.Types.ObjectId(cleanCleanerId);

                    const cleaner = await User.findById(cleanerId);
                    if (cleaner) {
                        finalCleaner.push(cleaner._id);
                    }
                }
            }

            if (rowInspectorId !== "") { 
                const inspectors = rowInspectorId.split(',');
                for (const inspectorName of inspectors) {
                    const cleanInspectorId = inspectorName.replace(/['"]/g, '').trim();
                    const inspectorId = new mongoose.Types.ObjectId(cleanInspectorId);

                    const inspector = await User.findById(inspectorId);
                    if (inspector) {
                        finalInspector.push(inspector._id);
                    }
                }
            }

            // create the unique cleaner
            const uniqueCleaners = Array.from(new Set(finalCleaner));
            const uniqueInspectors = Array.from(new Set(finalInspector));

            const workOrderAssigneeData = { 
                workOrderId: newWorkOrder._id,
                team: teamId, 
                cleaner: uniqueCleaners, 
                inspector: uniqueInspectors
            };
            const newWorkOrderAssignee = new WorkOrderAssigneeModel(workOrderAssigneeData);
            await newWorkOrderAssignee.save();

            console.log(`-----------Added work assignee for ${rowNumber}-------------------------`)


            // get the roomId, assetId and assetTaskType 
            
            const rowAssetId = row.getCell(10).text;
            const rowRoomId = row.getCell(9).text;

            const cleanAssetId = rowAssetId.replace(/['"]/g, '').trim();
            const assetId = new mongoose.Types.ObjectId(cleanAssetId);

            const cleanRoomId = rowRoomId.replace(/['"]/g, '').trim();
            const roomId = new mongoose.Types.ObjectId(cleanRoomId);

            // insert into the workOrderAssetTask 
            await workOrderAssetTaskModel.create({ 
                workOrderId: newWorkOrder._id, 
                assetTask: assetTaskId
            });

            console.log(`-----------Added work order asset task for ${rowNumber}-------------------------`)

            

            console.log(`-----------Found asset task details for ${rowNumber}-------------------------`)

            // update the AssetTaskType mss active to true 
            await AssetTaskType.findByIdAndUpdate(assetTaskId, { mssActive: true }, { new: true });

            console.log(`-----------Updated asset task ${rowNumber}-------------------------`)

            const scheduledDates = generateScheduledDates(finalStartDate, finalEndDate, assetTaskDetails?.cleaningTypeFrequency?.availableInterval, assetTaskDetails?.cleaningTypeFrequency?.interval, assetTaskDetails?.cleaningTypeFrequency?.excludeWeekend, assetTaskDetails?.cleaningTypeFrequency?.unit, assetTaskDetails?.cleaningTypeFrequency?.validStartHour, assetTaskDetails?.cleaningTypeFrequency?.validStopHour, rowNumber, workOrderName.text );

            console.log(`-----------Fetched schedule date for ${rowNumber}-------------------------`)


            console.log(`${rowNumber} data are ${workOrderName.text} teamId ${rowTeamId}`)
            for (let i = 0; i < scheduledDates.length; i++) { 
                const validCleaningTime = new Date(scheduledDates[i]);
                validCleaningTime.setHours(validCleaningTime.getHours() + Number(rowCleaningValidPeriod));
                
                tasks.push({
                    workOrderId: newWorkOrder._id, 
                    assetId: assetId, 
                    assetTaskType: assetTaskId,
                    roomId: roomId, 
                    scheduledDate: scheduledDates[i],
                    validCleaningPeriod: validCleaningTime, 
                    exclude: false, 
                    isDone: false, 
                    isApproved: false
                });
                
            }
            console.log(`for row number => ${rowNumber} ${scheduledDates.length} were pushed`)
            console.log(`for row number task length is now => ${tasks.length}`)
            if (tasks.length >= BATCH_SIZE) { 
                console.log('heyy task is now >= batch size', tasks.length)
                try{
                    await WorkOrderTaskModel.insertMany(tasks,{ordered: true});
                    
                    console.log('------inserting done--------', tasks.length)
                    tasks = []
                }catch(error:any){
                    console.log(error)
                    Logger.error('Something went wrong while inserting tasl', error)
                }
                

                console.log('------inserting finishedd--------', tasks.length)
            }

            console.log(`--------Ending ${rowNumber}------`)
        }

        // Final insertion for any remaining tasks
        if (tasks.length > 0) {
            try {
                await WorkOrderTaskModel.insertMany(tasks, { ordered: true });
                console.log('------final inserting done--------', tasks.length);
            } catch (error: any) {
                console.log(error);
                Logger.error('Something went wrong while inserting final tasks', error);
            }
        }

        
        return customResponse.successResponse('Uploaded successfully', {}, res);
       
    } catch (error: any) { 
        Logger.error(error);
        return customResponse.serverErrorResponse('An error occurred while processing a row', res, error);
    }
});


export default{ 
    uploadCleaner, 
    autoGenerateTeams,
    generateWorkOrderSample, 
    uploadSampleWorkOrder,
    uploadSampleStreamed
}