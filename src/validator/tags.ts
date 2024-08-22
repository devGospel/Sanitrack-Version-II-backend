import Joi from "joi";
import mongoose from "mongoose";

interface createTag { 
    name: string, 
}
interface updateTag { 
    name: string
}
interface params { 
    tagId: mongoose.Types.ObjectId
}

const tagValidationSchema = { 
    createTag: Joi.object<createTag>({ 
        name: Joi.string().regex(/^[\w\s,-]+$/).required().label('The tag name is required'),   
    }), 
    getSingleTag: Joi.object<params> ({ 
        tagId: Joi.string().required().label('The tag Id is required')
    }), 
    updateTag: Joi.object<updateTag>({ 
        name: Joi.string().required().label('The name is required!')
    })
}

export default tagValidationSchema