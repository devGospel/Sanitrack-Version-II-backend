import Joi from 'joi';

// Define and export validation schemas using Joi
// type address = {
//   country: string; 
//   state: string; 
//   city: string; 
//   home_address: string
// }

interface CreateUserSchema {
  username: string;
  password: string;
  email: string; 
  address: {country: string, state: string, city: string, home_address:string}; 
  phone_number: string;
  flag: string;
  role_id: string; 
  role_name: string
}


interface LoginSchema {
  email: string;
  password: string;
  selectedRoleId: string
}

interface updateUsernameSchema {
  username: string;
  password: string;
  email: string; 
  address: {country: string, state: string, city: string, home_address:string}; 
  phone_number: string;
}


const validationSchemas = {
  // Schema for creating a user
  createUser: Joi.object<CreateUserSchema>({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    address: Joi.object({
      country: Joi.string().required(),
      state: Joi.string().required(),
      city: Joi.string().required(),
      home_address: Joi.string().required(),
    }).required(),
    phone_number: Joi.string().required(), 
    role_id: Joi.string().required(), 
    role_name: Joi.string().required()
  }),

  // Schema for user login
  login: Joi.object<LoginSchema>({
    email: Joi.string().required(),
    password: Joi.string().required(),
    selectedRoleId: Joi.string().optional()

  }),

  // Schema for get user
  updateUsername: Joi.object<updateUsernameSchema>({
    username: Joi.string().required(),
    password: Joi.string().required(),
    email: Joi.string().email().required(),
    address: Joi.object({
      country: Joi.string().required(),
      state: Joi.string().required(),
      city: Joi.string().required(),
      home_address: Joi.string().required(),
    }).required(),
    phone_number: Joi.string().required()
  }),
};

export default validationSchemas;
