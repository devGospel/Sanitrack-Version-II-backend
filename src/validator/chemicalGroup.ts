import Joi from "joi";
import mongoose from "mongoose";

interface createTag { 
    name: string, 
}
interface updateTag { 
    name: string
}
interface params { 
    chemicalGroupId: mongoose.Types.ObjectId
}

const chemcialGroupValidationSchema = { 
    createChemicalGroup: Joi.object<createTag>({ 
        name: Joi.string().regex(/^[\w\s,-]+$/).required().label('The tag name is required'),
    }), 
    getSingleChemicalGroup: Joi.object<params> ({ 
        chemicalGroupId: Joi.string().required().label('The chemical Group Id is required')
    }), 
    updateChemicalGroup: Joi.object<updateTag>({ 
        name: Joi.string().required().label('The name is required!')
    })
}

export default chemcialGroupValidationSchema