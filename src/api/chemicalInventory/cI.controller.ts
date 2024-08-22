import customResponse from "../../helpers/response"
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";

import { createChildLogger } from "../../utils/childLogger";
import ChemicalInventoryModel from "../../models/chemicalInventory";
import mongoose from "mongoose";
import ChemicalPurchaseModel from "../../models/chemicalPurchase";
import ChemicalGroupModel from "../../models/chemicalGroup";
import TagModel from "../../models/tags";

const moduleName = '[chemicalInventory/controller]'
const Logger = createChildLogger(moduleName)

const addChemical = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        let session
        session = await mongoose.startSession()
        session.startTransaction()
        const {name, group, tags, SKU, description,quantity, unit, minimum_concentration, maximum_concentration,concentration_unit, purchase_details} = req.body
        // check if the chemical entered belongs to tht group choosen 
         // purchase_details: {
        //     "supplier": "Orion Resources", 
        //     "purchase_date": 2024-04-03,
        //     "unit_price": 300,
        //     "total_cost": 40000,
        //     "purchase_order_number": 09876sdhsdfhjsdfy887,
        //     "expiration_date": 2025-09-08,
        //     "storage_location": "Somewhere",
        //     "safety_data_sheet": 32435435
        // }
         // Insert the purchase details
        const purchaseDetailDoc = new ChemicalPurchaseModel({
            supplier: purchase_details.supplier, 
            purchase_date: purchase_details.purchase_date, 
            unit_price: purchase_details.unit_price, 
            total_cost: purchase_details.total_cost, 
            purchase_order_number: purchase_details.purchase_order_number, 
            expiration_date: purchase_details.expiration_date, 
            storage_location: purchase_details.storage_location, 
            safety_data_sheet: purchase_details.safety_data_sheet
        });
        const savedPurchaseDoc = await purchaseDetailDoc.save({session}) 

        if(group){ 
            const existingGroup = await ChemicalGroupModel.findById(group)
            if(!existingGroup) { 
                return customResponse.notFoundResponse('Such group Id does not exists', res)
            }
        }
       

        const validTags = await TagModel.find({ _id: { $in: tags } });

        if (validTags.length !== tags.length) {
            return customResponse.notFoundResponse('Incorrect tag Id passed', res)
        }
        const duplicate = await ChemicalInventoryModel.findOne({group: group, name: name})
        if(duplicate) return customResponse.badRequestResponse('This chemical is already part of the selected group', res)

        const chemicalInventoryDoc = new ChemicalInventoryModel({
            name: name, 
            group: group, 
            purchase_details: savedPurchaseDoc._id,
            SKU: SKU, 
            description: description, 
            quantity: quantity, 
            unit: unit, 
            minimum_concentration: minimum_concentration, 
            maximum_concentration: maximum_concentration, 
            concentration_unit: concentration_unit,
            tags: tags
        })
        await chemicalInventoryDoc.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();
        return customResponse.successResponse('Chemical inventory and purchase details created', chemicalInventoryDoc, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the add chemical endpoint', res, error)
    }
}

const getChemical = async(req: AuthenticatedRequest, res: Response) => { 
    try {
        const cIQuery = ChemicalInventoryModel.find().sort({ _id: -1 }).populate('group purchase_details').populate({
            path: 'tags',
            model: 'tags' // Assuming 'TagModel' is the name of your TagModel
        })

        const [totalChemicalInventory, allChemicalGroupInventory] = await Promise.all([
            ChemicalInventoryModel.countDocuments(),
            cIQuery.exec(),
        ]);

        // Prepare data to send in the response
        const data = {
            totalChemicalInventory,
            allChemicalInventory: allChemicalGroupInventory,
        };
        // Return success response with paginated task information
        return customResponse.successResponse('Get all chemical Inventory successful', data, res);
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the get chemical inventory endpoint', res, error)
    }
}

const getSingleChemical = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const {chemicalId} = req.query
        const chemical = await ChemicalInventoryModel.findById(chemicalId).populate('group purchase_details').populate({
            path: 'tags', 
            model: 'tags'
        })
        if(!chemical) return customResponse.badRequestResponse("There is no chemical with the id", res)
        return customResponse.successResponse('Chemical details', chemical,res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the get single chemical details endpoint', res, error)
    }
}

const updateChemical = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const {chemicalId} = req.query
        const {name, group, SKU, description, quantity, unit, minimum_concentration, maximum_concentration, concentration_unit, tags} = req.body

        const exists = await ChemicalInventoryModel.findById(chemicalId)
        if(!exists) return customResponse.badRequestResponse('There is no chemical item with this id', res)

        const update = await ChemicalInventoryModel.findByIdAndUpdate(chemicalId, 
            {$set: {
                name: name, 
                group: group, 
                SKU: SKU, 
                description: description, 
                quantity: quantity, 
                unit: unit, 
                minimum_concentration: minimum_concentration, 
                maximum_concentration: maximum_concentration, 
                concentration_unit: concentration_unit, 
                tags: tags
            }})
            return customResponse.successResponse('Update sucessful', update, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the update chemical endpoint', res, error)
    }
}

const deleteChemical = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the delete chemical endpoint', res, error)
    }
}

const testResult = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const {chemicalId} = req.query
        const {minimum_concentration, maximum_concentration} = req.body
        let result
        const range = await ChemicalInventoryModel.findById(chemicalId)
        if(!range) return customResponse.badRequestResponse('This chemical does not exist', res)

        if(minimum_concentration >= range.minimum_concentration && maximum_concentration <= range.maximum_concentration){
            result = 'Concentration Ok'
        }else{ 
            result = 'Concentration Not OK'
        }
        return customResponse.successResponse('result', result, res)
    } catch (error:any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occured in the test result endpoint', res, error)

    }
    
}

const calculateConcentration = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the calculate concentration endpoint', res, error)
        
    }
}
export default { 
    addChemical, 
    getChemical,
    getSingleChemical,
    updateChemical,
    deleteChemical, 
    testResult, 
    calculateConcentration
}