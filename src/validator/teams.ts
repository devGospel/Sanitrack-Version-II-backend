import { NextFunction } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';

interface createTeam{ 
    teamName: String;
    facilityId: mongoose.Types.ObjectId; 
    members: [{
        userId:{type: mongoose.Types.ObjectId}, 
        roleId: {type: mongoose.Types.ObjectId}
    }]
}

const teamValidationSchema = {
    createTeam: Joi.object<createTeam>({ 
        teamName: Joi.string().min(3).max(50).required().label('Team name is required'), 
        facilityId: Joi.string().optional().label('Facility Id'),
        members: Joi.array().items(
            Joi.object({ 
                userId: Joi.string().required().label('User Id is required'), 
                roleId: Joi.string().required().label('Role Id is required')
            }) 
        ).required().label('User Id and role Id are required')
    }), 
    editTeam: Joi.object({ 
        teamName: Joi.string().min(3).max(50).required(),
        members: Joi.array().items(Joi.object({
            userId: Joi.string().custom((value, helpers) => {
              if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.message({ custom: 'Invalid user ID' });
              }
              return value;
            }).required(),
            roleId: Joi.string().custom((value, helpers) => {
              if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.message({custom: 'Invalid role ID'});
              }
              return value;
            }).required()
          })).min(1).required()
    })
}

export default teamValidationSchema