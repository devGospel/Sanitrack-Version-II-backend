import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import { createChildLogger } from "../../utils/childLogger";
import customResponse from "../../helpers/response"
import ChemicalMixModel from "../../models/chemicalMix";
import ChemicalInventoryModel from "../../models/chemicalInventory";
import SubChemicalMixModel from "../../models/subChemicalMix";
import User from "../../models/user";


const moduleName = '[chemicalMix/controller]'
const Logger = createChildLogger(moduleName)
const addChemicalMix = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, chemicalId, notes, unit, minimum_concentration, maximum_concentration, titrationCount } = req.body

        const duplicate = await ChemicalMixModel.findOne({ name: name })
        if (duplicate) return customResponse.badRequestResponse('This chemicalMix is already Exists', res)

        const existingChemical = await ChemicalInventoryModel.findById({ _id: chemicalId })
        if (!existingChemical) return customResponse.badRequestResponse('This chemical does not Exist', res)

        const create = await ChemicalMixModel.create({
            name: name,
            chemicalId: existingChemical,
            notes: notes,
            unit: unit,
            titrationCount: titrationCount,
            maximum_concentration: maximum_concentration,
            minimum_concentration: minimum_concentration,

        })

        return customResponse.successResponse('Chemical mix has been created', create, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error Occured in the adding of chemical Mix', res, error)
    }
}

// Get all chemical mixes
const getChemicalMixes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const chemicalMixes = await ChemicalMixModel.find();
        return customResponse.successResponse('Chemical mixes retrieved successfully', chemicalMixes, res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse('An error occurred while fetching chemical mixes', res, error);
    }
};

// Get a single chemical mix by ID
const getChemicalMixById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const chemicalMix = await ChemicalMixModel.findById(id);
        if (!chemicalMix) return customResponse.notFoundResponse('Chemical mix not found', res);
        return customResponse.successResponse('Chemical mix retrieved successfully', chemicalMix, res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse('An error occurred while fetching the chemical mix', res, error);
    }
};

const updateChemicalMix = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, chemicalId, notes, unit, minimum_concentration, maximum_concentration, concentration_unit, titrationCount } = req.body;

        const chemicalMix = await ChemicalMixModel.findById(id);
        if (!chemicalMix) return customResponse.notFoundResponse('Chemical mix not found', res);
        const existingChemical = await ChemicalInventoryModel.findById({ _id: chemicalId })
        if (!existingChemical) return customResponse.badRequestResponse('This chemical does not Exist', res)

        // Check for duplicate name if the name is being updated
        if (name && name !== chemicalMix.name) {
            const duplicate = await ChemicalMixModel.findOne({ name });
            if (duplicate) return customResponse.badRequestResponse('This chemical mix name already exists', res);
        }

        chemicalMix.name = name || chemicalMix.name;
        chemicalMix.chemicalId = chemicalId || chemicalMix.chemicalId;
        chemicalMix.notes = notes || chemicalMix.notes;
        chemicalMix.unit = unit || chemicalMix.unit;
        chemicalMix.titrationCount = titrationCount || chemicalMix.titrationCount;
        chemicalMix.minimum_concentration = minimum_concentration !== undefined ? minimum_concentration : chemicalMix.minimum_concentration;
        chemicalMix.maximum_concentration = maximum_concentration !== undefined ? maximum_concentration : chemicalMix.maximum_concentration;
        chemicalMix.concentration_unit = concentration_unit || chemicalMix.concentration_unit;

        const updatedChemicalMix = await chemicalMix.save();
        return customResponse.successResponse('Chemical mix updated successfully', updatedChemicalMix, res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse('An error occurred while updating the chemical mix', res, error);
    }
};


const addSubChemicalMix = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            name,
            originalMix,
            cleanerId,
            unit,
            titrationCount
        } = req.body;

        // Check if the original ChemicalMix exists
        const chemicalMix = await ChemicalMixModel.findById(originalMix).populate('chemicalId');
        if (!chemicalMix) {
            return customResponse.badRequestResponse('The referenced chemical mix does not exist', res);
        }
        const cleaner = await User.findById(cleanerId);
        if (!cleaner) {
            return customResponse.badRequestResponse('This user does not exist', res);
        }

        // Access the chemicalName from the populated chemicalId
        const chemicalName = (chemicalMix.chemicalId as any).chemicalName;

        // Create a new SubChemicalMix

        const newSubChemicalMix = new SubChemicalMixModel({
            name,
            originalMix,
            cleanerId,
            chemicalName,
            unit,
            date_added: new Date(),
            titrationCount
        });

        // Save the new SubChemicalMix
        const savedSubChemicalMix = await newSubChemicalMix.save();

        return customResponse.successResponse('Sub chemical mix has been created', savedSubChemicalMix, res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse('An error occurred while adding the sub chemical mix', res, error);
    }
};
export default {
    addChemicalMix,
    getChemicalMixes,
    getChemicalMixById,
    updateChemicalMix,
    addSubChemicalMix
}