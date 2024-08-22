import Joi, { NumberSchema } from "joi"
import mongoose from "mongoose"

interface purchaseDetail{ 
    supplier: string, 
    purchase_date: Date,
    unit_price: Number,
    total_cost: Number,
    purchase_order_number: String,
    expiration_date: Date,
    storage_location: String,
    safety_data_sheet: mongoose.Types.ObjectId
}
interface createChemicalInventory { 
   name: string,
   group: mongoose.Types.ObjectId, 
   purchase_details: purchaseDetail,
   SKU: string, 
   description: string, 
   quantity: Number,
   unit: string, 
   minimum_concentration: Number, 
   maximum_concentration: Number, 
   concentration_unit: string, 
   tags: [mongoose.Types.ObjectId]
}


interface params{ 
    chemicalId: mongoose.Types.ObjectId
}

interface testResult{ 
    minimum_concentration: Number
    maximum_concentration: Number
}

const purchaseDetailSchema = {
    supplier: Joi.string().optional().label('The supplier is needed'),
    purchase_date: Joi.date().optional().label('The purchase date is optional'),
    unit_price: Joi.number().optional().label('The unit price is optional'),
    total_cost: Joi.number().optional().label('The total cost is optional'),
    purchase_order_number: Joi.string().optional().label('The purchase order number is optional'),
    expiration_date: Joi.date().optional().label('The expiration date is optional'),
    storage_location: Joi.string().optional().label('The storage location is optional'),
    safety_data_sheet: Joi.string().allow(null).optional().label('The safety data sheet ID is optional')
};

const chemicalInventoryValidationSchema = { 
    addChemical: Joi.object<createChemicalInventory>({ 
        name: Joi.string().required().label('The name is required'),
        group:Joi.string().allow(null).optional().label('Chemical group is required'), 
        purchase_details: Joi.object(purchaseDetailSchema).optional(),
        SKU: Joi.string().pattern(/CHEM-/).required().label('The SKU must begin with CHEM'), // Adjust 'PREFIX-' to your desired prefix
        description: Joi.string().max(500).required().label('A description is required and the description must not extend 500 words'),
        quantity: Joi.number().required().default(0).label('The quantity is required'),
        unit: Joi.string().valid('ml', 'L', 'gallon').required().label('The unit of measurement for the chemical is required(ml, L, gallon)'),
        minimum_concentration: Joi.number().default(0.0),
        maximum_concentration: Joi.number().default(0.0),
        concentration_unit: Joi.string().default('PPM'),
        tags: Joi.array().items(Joi.string().optional()).label('The tag is optional')
    }), 

    accessSingle: Joi.object<params>({
        chemicalId: Joi.string().required().label('The chemical Id is required')
    }), 

    testResult: Joi.object<testResult>({ 
        minimum_concentration: Joi.number().required().label('The minimum concentration is required'), 
        maximum_concentration: Joi.number().required().label('The maximum concentration is required')
    })
}

export default chemicalInventoryValidationSchema