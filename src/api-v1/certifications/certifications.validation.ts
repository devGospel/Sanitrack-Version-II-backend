import Joi from "joi";
import mongoose from "mongoose";

interface createCertification {
    name: string,
    level: number
}

// Interface for updating a cleaning type
interface updateCertification {
    name?: string,
    level?: number
}

const CertificationValidationSchema = {
    createCertification: Joi.object<createCertification>({
        name: Joi.string().required().label('The name is required')
    }),

    updateCertification: Joi.object<updateCertification>({
        name: Joi.string().optional().label('The name is optional'),
        level: Joi.number().max(3).optional().label('The level is optional')
    })
}

export default CertificationValidationSchema