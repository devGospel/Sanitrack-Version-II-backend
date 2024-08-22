import e, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import customResponse from "../../helpers/response";
import User from '../../models/user';
import { AuthenticatedRequest } from '../../middlewares/security';
import crypto from 'crypto'
import nodemailer from "nodemailer"
import notificationController from '../notifications/notification.controller';

// Load environment variables from a .env file
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import TaskModel from '../../models/task'
import RoomModel from '../../models/room';
import UserRoles from '../../models/userRoles';
import Address from '../../models/address';
import Role from '../../models/role';
import { generateOTP } from '../../helpers/otp';
import sendEmail  from '../../helpers/emailSender';
import { createChildLogger } from '../../utils/childLogger';
import LoginLogs from '../../models/loginLogs';
import catchAsync from '../../utils/catchAsync';
import { managerFacilityCheck } from '../../services/managerAsset';
import CleanerFacilityModel from '../../models/cleanerFacilities';
import InspectorFacilityModel from '../../models/inspectorFacilities';
import ManagerFacilityModel from '../../models/managerFacilities';
import { Roles } from '../../constant/roles';
// import {transport} from "../../config/nodemailer"

dotenv.config();

const moduleName = '[user/controller]'
const Logger = createChildLogger(moduleName)

const JWT_KEY: string = process.env.JWT_KEY!;
const TOKEN_VALIDATION_DURATION: string = process.env.TOKEN_VALIDATION_DURATION!;


const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { password, username, email, phone_number, role_id, role_name, address } = req.body;
        // Logger.info(address.country)
        // Check if username is already in use
        const lowerCaseUsername = username.toLowerCase();
        const existingUsername = await User.findOne({ username: lowerCaseUsername });
        if (existingUsername) {
            return customResponse.badRequestResponse('Username already in use', res);
        }
        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 12);
        // create new address 
        const newAddress = await Address.create(address)
        // Create new user
        const user = await User.create({
            username: lowerCaseUsername,
            password: password,
            email: email, 
            address_id: newAddress._id, 
            phone_number: phone_number,
            flag: 'ACTIVE'
        });

        const userRole = await UserRoles.create({
            user_id: user._id,
            user_name: user.username,
            role_id: role_id, 
            role_name: role_name
        });
        const newUser = {
            id: user._id,
            role: userRole._id,
            username: user.username,
        };

        return customResponse.createResponse('User created successfully', newUser, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the create user endpoint',
            res,
            err
        );
    }
};

const userProfile = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
        const userId = req.auth.userId; 
        // Logger.info(`user profile id => ${userId}`)

        const result = await User.findById(userId).populate('address_id')
        return customResponse.successResponse('User profile', result, res)
    }catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get profile endpoint',
            res,
            err
        );
    }
}

const editProfile = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
        const userId = req.auth.userId
        const { password, username, email, phone_number, address } = req.body;

        if(!userId) return customResponse.unAuthorizedResponse('Please login', res)
        // check if there is user with the loggedin
        const userDetails = await User.findById(userId)
        if(!userDetails) return customResponse.badRequestResponse('User not found', res)

        const userAddress = await Address.findById(userDetails.address_id)
        if(!userAddress) return customResponse.badRequestResponse('User does not have an address to update', res)

        const hashedPassword = await bcrypt.hash(password, 12);

        userAddress.country = address.country
        userAddress.state = address.state
        userAddress.city = address.city
        userAddress.home_address = address.home_address

        userDetails.username = username
        userDetails.password = hashedPassword
        userDetails.email = email
        userDetails.phone_number = phone_number
    
        await userDetails.save()
        await userAddress.save()

        
        // check if the logged in id
    }catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get profile endpoint',
            res,
            err
        );
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        // Check if user exists

        const lowerCaseEmail = email.toLowerCase();
        const trimmedEmail = lowerCaseEmail.replace(/\s+/g, '');
        const user = await User.findOne({email: trimmedEmail}).select('+password +role');
        if (!user) {
            return customResponse.badRequestResponse('Incorrect credentials', res);
        }
        // Check if password matches
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return customResponse.badRequestResponse('Incorrect credentials', res);
        }
        // Check if the user that wants to login is ACTIVE
        if(user.flag !== 'ACTIVE'){ 
            return customResponse.badRequestResponse('Cannot Login, you are fired', res)
        }
        // Get the user role from the role collections
        const userRoles = await UserRoles.find({user_id: user._id}).populate('role_id')
        console.log(userRoles)
        if (userRoles.length === 0) { 
            return customResponse.badRequestResponse('Meet support or admin to assign a role to you', res);
        }
       
        if(userRoles.length == 1){ 
            // Generate the JWT token for person with one role. 
            const token = jwt.sign({ userId: user._id, username: user.username, role_id: userRoles[0].role_id}, JWT_KEY, {
                expiresIn: 360000,
            });
         
            let userData
            // Logger.info(`from the user controller => ${to}`)
            if(userRoles[0].role_name == Roles.MANAGER){ 
                // fetch the first facility assigned to the manager 
                const assignedFacility:any = await ManagerFacilityModel.findOne({managerId: user._id}).populate('assignedFacilities')
                if(!assignedFacility){ 
                    userData = {hasFacility: false, requiredRoleSelection: false, token, userId: user._id, username: user.username, role_id: userRoles[0].role_id._id, role_name: userRoles[0].role_name};
                }else{ 
                    userData = {hasFacility: true, facility: assignedFacility.assignedFacilities[0]._id,facilityName:assignedFacility.assignedFacilities[0].facility_name, requiredRoleSelection: false, token, userId: user._id, username: user.username, role_id: userRoles[0].role_id._id, role_name: userRoles[0].role_name};
                }
            }
            else if(userRoles[0].role_name == Roles.CLEANER){ 
                const assignedFacility:any = await CleanerFacilityModel.findOne({assignedCleaners: {$in:user._id}}).populate('facilityId')
                if(!assignedFacility){ 
                    userData = {hasFacility: false, requiredRoleSelection: false, token, userId: user._id, username: user.username, role_id: userRoles[0].role_id._id, role_name: userRoles[0].role_name};
                }else{ 
                    userData = {hasFacility: true, facility: assignedFacility.facilityId._id, facilityName:assignedFacility.facilityId.facility_name, requiredRoleSelection: false, token, userId: user._id, username: user.username, role_id: userRoles[0].role_id._id, role_name: userRoles[0].role_name};
                }
            }else if((userRoles[0].role_name == Roles.INSPECTOR) || (userRoles[0].role_name == Roles.SUPERVISOR)){ 
                const assignedFacility:any = await InspectorFacilityModel.findOne({assignedInspectors: {$in:user._id}}).populate('facilityId')
                if(!assignedFacility){ 
                    userData = {hasFacility: false, requiredRoleSelection: false, token, userId: user._id, username: user.username, role_id: userRoles[0].role_id._id, role_name: userRoles[0].role_name};
                }else{ 
                    userData = {hasFacility: true, facility: assignedFacility.facilityId._id, facilityName:assignedFacility.facilityId.facility_name, requiredRoleSelection: false, token, userId: user._id, username: user.username, role_id: userRoles[0].role_id._id, role_name: userRoles[0].role_name};
                }
            }else{
                userData = {requiredRoleSelection: false, token, userId: user._id, username: user.username, role_id: userRoles[0].role_id._id, role_name: userRoles[0].role_name};
            
            }
           
            // record the users login log 
            let loginLog = await LoginLogs.findOne({userId: userData.userId, roleId: userData.role_id})
            if(loginLog){ 
                await LoginLogs.findOneAndUpdate(
                    {userId: userData.userId, roleId: userData.role_id}, 
                    { $set: { updatedAt: new Date() } },
                    { new: true }
                )
            }else{ 
                await LoginLogs.create({ 
                    userId: userData.userId, 
                    roleId: userData.role_id
                })
            }
            return customResponse.successResponse('Login successful', userData, res);
            
            
        }else if (userRoles.length > 1){ 
            const availableRoles = userRoles.map((role) => ({
                role_id: role.role_id._id, 
                role_name: role.role_name
            }))
            const token = jwt.sign({ userId: user._id, username: user.username, roleId: availableRoles[0].role_id, role_name: availableRoles[0].role_name}, JWT_KEY, {
                expiresIn: '180s',
            });
            const responseData = { 
                requiredRoleSelection: true, 
                assignedRoles: availableRoles, 
                userId: user._id, 
                token:token
            }
            return customResponse.successResponse('Please select a role to continue', responseData, res)
        }
       
        // Generate a QRCODE for cleaner
        let qrcode;
        // if(user.role === 'cleaner') {
        //     const userId: string = user._id;
        //     const role: string = user.role;
        //     const qrCodeData: string = JSON.stringify({ userId, role });
        //     qrcode = await TaskService.generateQRCode(qrCodeData);
        // }
        // // Serialize user data
        // const userData = {
        //     QRCode: user.role === 'cleaner' ? qrcode.data : null ,
        //     token,
        //     id: user._id,
        //     role: user.role,
        //     username: user.username
        // };

    } catch (err: any) {
        Logger.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the login endpoint',
            res,
            err
        );
    }
};

const selectRoleLogin = async (req: AuthenticatedRequest, res: Response) => { 
    try {
        const userId = req.auth.userId
        const {selectedRoleId} = req.body

        if(!selectedRoleId){ return customResponse.badRequestResponse('Select a role', res)}
        const user = await User.findById(userId)
        if (!user) {
            return customResponse.badRequestResponse('Incorrect credentials', res);
        }

        // add check to see if the user passed in the correct roleID
        const userRole = await UserRoles.find({role_id: selectedRoleId})
       
        if(userRole.length > 0){ 
            let userData 
            const token = jwt.sign(
                { userId: user._id, username: user.username, roleId: userRole[0].role_id._id, role_name: userRole[0].role_name}, 
                JWT_KEY, 
                {expiresIn: 360000,}
            );
            if(userRole[0].role_name == Roles.MANAGER){ 
                // fetch the first facility assigned to the manager 
                const assignedFacility:any = await ManagerFacilityModel.findOne({managerId: user._id}).populate('assignedFacilities')
                if(!assignedFacility){ 
                    userData = {hasFacility: false, token, userId: user._id, username: user.username, role_id: selectedRoleId, role_name: userRole[0].role_name};
                }else{ 
                    userData = {hasFacility: true, facility: assignedFacility.assignedFacilities[0]._id, facilityName:assignedFacility.assignedFacilities[0].facility_name, token, userId: user._id, username: user.username, role_id: selectedRoleId, role_name: userRole[0].role_name};
                }
            }else if(userRole[0].role_name == Roles.CLEANER){ 
                const assignedFacility:any = await CleanerFacilityModel.findOne({assignedCleaners: {$in:user._id}}).populate('facilityId')
                if(!assignedFacility){ 
                    userData = {hasFacility: false,  token, userId: user._id, username: user.username, role_id:selectedRoleId, role_name: userRole[0].role_name};
                }else{ 
                    userData = {hasFacility: true, facility: assignedFacility.facilityId._id, facilityName:assignedFacility.facilityId.facility_name,  token, userId: user._id, username: user.username, role_id:selectedRoleId, role_name: userRole[0].role_name};
                }
            }else if((userRole[0].role_name == Roles.INSPECTOR) || (userRole[0].role_name == Roles.SUPERVISOR)){ 
                const assignedFacility:any = await InspectorFacilityModel.findOne({assignedInspectors: {$in:user._id}}).populate('facilityId')
                if(!assignedFacility){ 
                    userData = {hasFacility: false,  token, userId: user._id, username: user.username, role_id:selectedRoleId, role_name: userRole[0].role_name};
                }else{ 
                    userData = {hasFacility: true, facility: assignedFacility.facilityId._id, facilityName:assignedFacility.facilityId.facility_name, token, userId: user._id, username: user.username, role_id: selectedRoleId, role_name: userRole[0].role_name};
                }
            }else{
                userData = {hasFacility: false, token, userId:user._id, username: user.username, role_id: selectedRoleId, role_name: userRole[0].role_name}      
            }
           
            // record the users login log 
            let loginLog = await LoginLogs.findOne({userId: userData.userId, roleId: userData.role_id})
            if(loginLog){ 
                await LoginLogs.findOneAndUpdate(
                    {userId: userData.userId, roleId: userData.role_id}, 
                    { $set: { updatedAt: new Date() } },
                    { new: true }
                )
            }else{ 
                await LoginLogs.create({ 
                    userId: userData.userId, 
                    roleId: userData.role_id
                })
            }

            return customResponse.successResponse('Login successful', userData, res);
        }else{ 
            return customResponse.badRequestResponse('Wrong role id passed', res)
        }

    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the select role endpoint', res, error)
    }
}

const forgotPassword = async(req:Request, res: Response) => {
    try {
        // ask them to enter email or password 
        const {email} = req.body
        // check if they are empty 
        if(!email) return customResponse.badRequestResponse('Enter an email', res)
        // get the user based on the email entered 
        const userData = await User.findOne({email: email})
        if(!userData) return customResponse.badRequestResponse('There is not user with that email address', res)

        // generate the OTP code 
        const otp = generateOTP()
        const timeZone = 'Africa/Lagos';
        const currentTime = new Date();
        const countryTime = new Date(currentTime.toLocaleString('en-US', { timeZone: timeZone }));
        const expiryTimestamp = new Date(countryTime.getTime() + 15 * 60000); //extends the time by 5 minutes

        // Logger.info(expiryTimestamp)
        sendEmail(email, otp)
        // save opt code in the database for that email
        userData.otp_code = otp 
        userData.otp_expiry_time = expiryTimestamp
        await userData.save()
        return customResponse.successResponse('otp', otp, res)
    } catch (error: any) {
        Logger.error(`this is coming from the forgot password ${error} `)
        return customResponse.serverErrorResponse('An error occured in the forgot user password', res, error)
    }
  

}

const resetPassword = async(req:Request, res:Response) => { 
    try {
        const {otp_code, new_password, confirm_password} = req.body

        // check if the old_password and new_password is the same
        if(new_password !== confirm_password) return customResponse.badRequestResponse('Password must be the same', res)
        // find the users account based on the otp_code entered

        const userData = await User.findOne({otp_code: otp_code})
        if(!userData) return customResponse.badRequestResponse('There is no user with this otp code', res)

        const currentLagosTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));

        // check if the otp code entered is still valid by checking if current time is less than expiry time 
        const otpIsValid = otp_code == userData.otp_code &&  currentLagosTime <= new Date(userData.otp_expiry_time) ? true: false
        // Logger.info(currentLagosTime <= userData.otp_expiry_time)

        if(!otpIsValid) return customResponse.badRequestResponse('Your code has expired or you did not put in the right code', res)
        
        // update the userData with the new password but has password first 
        const hashedPassword = await bcrypt.hash(new_password, 12);

        userData.password = hashedPassword
        userData.save()
        return customResponse.successResponse('Password updated', {}, res)
    } catch (error:any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occured in the reset password endpoint', res, error)
    }  
}

const getUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Destructure userId from query parameters
        const { userId } = req.query;
        // Check if userId is undefined
        if (!userId) {
            return customResponse.badRequestResponse('User ID is required', res);
        }
        // Find user by ID
        const user = await User.findById(userId).sort({_id: -1});
        if (!user) {
            return customResponse.badRequestResponse('User not found', res);
        }
        // Return srialized user information
        return customResponse.successResponse('User fetched successfully', user, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get user endpoint',
            res,
            err
        );
    }
};

// gets all the active cleaners in the system
const getAllCleaners = async(req:AuthenticatedRequest, res:Response): Promise<void> => { 
    try{ 
        const allCleaners = await User.aggregate([
            {
                $match: {'flag': 'ACTIVE'}
            }, 
            {
                $lookup: {
                    from: 'userroles', 
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'user_roles'
                }
            }, 
            {
                $unwind: '$user_roles'
            }, 
            {
                $match: { 'user_roles.role_name': 'Cleaner' } // Additional match for specific role
            },
            {
                $project: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  address_id: 1,
                  phone_number: 1,
                  flag: 1,
                  role_name: '$user_roles.role_name'  // Extract role_name from user_roles
                }
            }
        ])
        const data = {allCleaners}
        return customResponse.successResponse('Active cleaners fetched.', data, res)
    }catch(err:any){ 
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all users endpoint',
            res,
            err
        );
    }
}

// gets all the inspectors in the system 
const getAllInspectors = async(req:AuthenticatedRequest, res:Response): Promise<void> => { 
    try{ 
        const allInspectors = await User.aggregate([
            {
                $match: {'flag': 'ACTIVE'}
            }, 
            {
                $lookup: {
                    from: 'userroles', 
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'user_roles'
                }
            }, 
            {
                $unwind: '$user_roles'
            }, 
            {
                $match: { 'user_roles.role_name': 'Inspector' } // Additional match for specific role
            },
            {
                $project: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  address_id: 1,
                  phone_number: 1,
                  flag: 1,
                  role_name: '$user_roles.role_name'  // Extract role_name from user_roles
                }
            }
        ])
        const data = {allInspectors}
        return customResponse.successResponse('Active Inspector fetched.', data, res)
    }catch(err:any){ 
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all users endpoint',
            res,
            err
        );
    }
}

const getAllManagers = catchAsync(async(req:AuthenticatedRequest, res: Response) => {
    const allManagers = await User.aggregate([
        {
            $match: {'flag': 'ACTIVE'}
        }, 
        {
            $lookup: {
                from: 'userroles', 
                localField: '_id',
                foreignField: 'user_id',
                as: 'user_roles'
            }
        }, 
        {
            $unwind: '$user_roles'
        }, 
        {
            $match: { 'user_roles.role_name': Roles.MANAGER } // Additional match for specific role
        },
        {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              address_id: 1,
              phone_number: 1,
              flag: 1,
              role_name: '$user_roles.role_name'  // Extract role_name from user_roles
            }
        }
    ])
    const data = {allManagers}
    return customResponse.successResponse('Active Inspector fetched.', data, res)

}) 
    
        
const getStaffByName = async(req: AuthenticatedRequest, res:Response) => { 
    try{ 

        const userName = req.query.userName
        const staff = await User.findOne({username: userName, flag: "ACTIVE"})

        if(!staff) return customResponse.badRequestResponse('Staff does not exist or fired', res)
        return customResponse.successResponse('staff fetched', staff, res)
    }catch(err:any){ 
        Logger.error(err)

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get staff by name endpoint',
            res,
            err
        );
    }
    
}


// change this to group by role
const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Explicitly cast query parameters to numbers and handle undefined
        const page = req.query.page ? Number(req.query.page) : undefined;
        const documentCount = req.query.documentCount ? Number(req.query.documentCount) : undefined;

        // Check if page or documentCount is undefined before using them
        if (page === undefined || documentCount === undefined) {
            return customResponse.badRequestResponse('Invalid page or documentCount', res);
        }
        // Get the total count of registered users
        const totalUsers = await User.countDocuments();

        // Fetch all users from the database
        const allUsers = await User.find({ role: { $ne: 'manager' } })
            .limit(documentCount)
            .skip(documentCount * (page - 1))
            .sort({ _id: -1 });

        // Calculate prevPage and nextPage
        const prevPage = page > 1 ? page - 1 : null;
        const nextPage = documentCount * page < totalUsers ? page + 1 : null;

        // Prepare data to send in the response
        const data = {
            page,
            prevPage,
            nextPage,
            documentCount,
            totalUsers,
            allUsers,
        };
        // Return success response with the list of users
        return customResponse.successResponse('Users fetched successfully', data, res);
    } catch (err: any) {
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all users endpoint',
            res,
            err
        );
    }
};


const updateUsername = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Destructure username from request body and id from auth
        const { username } = req.body;
        const { userId } = req.auth;

        // Find user by ID
        const user = await User.findById(userId);

        // Check if the user is not found
        if (!user) {
            return customResponse.badRequestResponse('User not found', res);
        }
        // Check if username is already in use
        const lowerCaseUsername = username.toLowerCase();
        const existingUsername = await User.findOne({ username: lowerCaseUsername });
        if (existingUsername) {
            return customResponse.badRequestResponse('Username already in use', res);
        }

        // Update username and save changes
        user.username = lowerCaseUsername;
        await user.save();

        // Return success response with updated user information
        return customResponse.successResponse('Username updated successfully', user, res);
    } catch (err: any) {
        console.error(err);
        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the update username endpoint',
            res,
            err
        );
    }
};

const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.body.staffId;
        const user = await User.findById(userId);
        const userNotifToken = user?.notificationToken
        
        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to Fire a user', res);
        }
        if(!mongoose.Types.ObjectId.isValid(userId)) return customResponse.badRequestResponse('Invalid Id Type', res)
        
        const deletedUser = await User.findByIdAndUpdate(
            {_id: userId}, 
            {$set: {flag: 'INACTIVE'}},
            {new: true}
        )
        if(userNotifToken) notificationController.sendNotification(userNotifToken, "Employment Status", "You have been fired!")
        // if(!deletedUser) return customResponse.notFoundResponse('There is no employee with such id', res )
        return customResponse.successResponse('User deleted successfully', deletedUser, res);
        
    } catch (err: any) {
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in delete endpoint',
            res,
            err
        );
    }
};

const generateCloudinarySignature = async (req: AuthenticatedRequest, res: Response) => {
    const timestamp = Math.round((new Date()).getTime() / 1000); // UNIX timestamp in seconds
    const apiSecret = process.env.CLOUDINARY_API_SECRETT; // Replace with your Cloudinary API Secret

    // Additional parameters can be added here if needed
    const signatureString = `timestamp=${timestamp}${apiSecret}`;

    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    res.json({
        signature: signature,
        timestamp: timestamp
    });
}

const updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => { 
    try{ 
        const  userId  = req.body.staffId;
        const user = await User.findById(userId);
        const userNotifToken = user?.notificationToken

        const role = req.auth.role_id.role_name;
        if(role !== 'Admin') {
            return customResponse.badRequestResponse('You do not have permission to restore a user', res);
        }
        if(!mongoose.Types.ObjectId.isValid(userId)) return customResponse.badRequestResponse('Invalid Id Type', res)
        
        const updatedUser = await User.findByIdAndUpdate(
            {_id: userId}, 
            {$set: {flag: 'ACTIVE'}},
            {new: true}
        )
        
        // if(!deletedUser) return customResponse.notFoundResponse('There is no employee with such id', res )
        // Send notification to updated user
        notificationController.sendNotification(userNotifToken, "User Status", "Your status has been updated by Admin");
        return customResponse.successResponse('User status updated sucessfully', updatedUser, res);
    }catch(err: any){ 
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in delete endpoint',
            res,
            err
        );
    }
}

const logOut = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    const userId = req.auth.userId 
    const roleId = req.auth.role_id && req.auth.role_id._id ? req.auth.role_id._id : req.auth.roleId

    // Update the login log entry with the logout time
    await LoginLogs.findOneAndUpdate(
        { userId, roleId },
        { $set: { logoutAt: new Date() } },
        { new: true }
    );

    return customResponse.successResponse('Log out successful', {}, res)
})
const getUnAssignedCleaners = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    // Get all assigned cleaners 
    const assignedCleaners = await CleanerFacilityModel.find().distinct('assignedCleaners')

    // Get all unassigned cleaners 
    const unAssignedCleaners = await UserRoles.find({
        user_id: { $nin: assignedCleaners },
        role_name: 'Cleaner'
    })

    return customResponse.successResponse('UnAssigned cleaners fetched', unAssignedCleaners, res)
})



const managerCleaners = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const managerId = req.auth.userId
    const {facilityId} = req.query

    const facilityCheck = await managerFacilityCheck(managerId, facilityId as string)
    if(!facilityCheck?.found){
        return customResponse.badRequestResponse(facilityCheck?.message, res)
    }
     // Step 1: Retrieve the assigned cleaners for the given facility
    const cleanerFacility = await CleanerFacilityModel.findOne({ facilityId: facilityId as string }).populate('assignedCleaners');

    if (!cleanerFacility) {
        return customResponse.successResponse('No cleaners assigned to this facility', [], res);
    }

    const assignedCleaners = cleanerFacility.assignedCleaners.map(cleaner => cleaner._id);

    // Step 2: Use aggregation to get roles where role_name is "Cleaner"
    const result = await UserRoles.aggregate([
        {
            $match: {
                user_id: { $in: assignedCleaners },
                role_name: Roles.CLEANER // Filter for roles where role_name is "Cleaner"
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $unwind: '$userDetails'
        },
        {
            $project: {
                user_id: 1,
                user_name: '$userDetails.username',
                role_id: 1,
                role_name: 1
            }
        }
    ]);
 
    return customResponse.successResponse('Users and their Cleaner roles for facility', result, res);
})

const managerSupervisors = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const managerId = req.auth.userId
    const {facilityId} = req.query

    const facilityCheck = await managerFacilityCheck(managerId, facilityId as string)
    if(!facilityCheck?.found){
        return customResponse.badRequestResponse(facilityCheck?.message, res)
    }
     // Step 1: Retrieve the assigned cleaners for the given facility
     const inspectorFacility = await InspectorFacilityModel.findOne({ facilityId: facilityId as string }).populate('assignedInspectors');

     if (!inspectorFacility) {
         return customResponse.successResponse('No inspector assigned to this facility', [], res);
     }
 
     const assignedInspector = inspectorFacility.assignedInspectors.map(inspectors => inspectors._id);
 
     // Step 2: Use aggregation to get roles where role_name is "Cleaner"
     const result = await UserRoles.aggregate([
         {
             $match: {
                 user_id: { $in: assignedInspector },
                 role_name: Roles.INSPECTOR // Filter for roles where role_name is "Cleaner"
             }
         },
         {
             $lookup: {
                 from: 'users',
                 localField: 'user_id',
                 foreignField: '_id',
                 as: 'userDetails'
             }
         },
         {
             $unwind: '$userDetails'
         },
         {
             $project: {
                 user_id: 1,
                 user_name: '$userDetails.username',
                 role_id: 1,
                 role_name: 1
             }
         }
     ]);
  
     return customResponse.successResponse('Users and their Inspector roles for facility', result, res);
})
export default {
    createUser,
    login,
    logOut,
    userProfile,
    editProfile,
    selectRoleLogin,
    forgotPassword, 
    resetPassword,
    getUser,
    getAllCleaners,
    getAllInspectors,
    getAllManagers,
    getAllUsers,
    getStaffByName,
    updateUsername,
    deleteUser, 
    updateUserStatus, 
    generateCloudinarySignature, 
    getUnAssignedCleaners,
    managerCleaners, 
    managerSupervisors
};
