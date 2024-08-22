import Joi from "joi";
import mongoose from "mongoose";

interface createProtectiveElementSchema {
    name: string,
    description: string,
    quantity: Number,
    pairs: Boolean
}

const ProtectiveElementValidationSchema = {
    createProtectiveElement: Joi.object<createProtectiveElementSchema>({
        name: Joi.string().required().label('The name is required'),
        description: Joi.string().max(255).optional().label('The description is optional'),
        quantity: Joi.number().required().label('The quantity is required'),
        pairs: Joi.boolean().optional().label('The pairs are optional ')
    }),
    updateProtectiveElement: Joi.object({
        name: Joi.string().optional().label('The name is optional'),
        description: Joi.string().max(255).optional().label('The description is optional'),
        quantity: Joi.number().optional().label('The quantity is optional'),
        pairs: Joi.boolean().optional().label('The pairs are optional')
    })
}

export default ProtectiveElementValidationSchema