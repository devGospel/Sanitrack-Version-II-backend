import mongoose from "mongoose";
import User from "../models/user";
import { managerFacilityCheck } from "./managerAsset";
import CleanerFacilityModel from "../models/cleanerFacilities";
import UserRoles from "../models/userRoles";
import { Roles } from "../constant/roles";
import InspectorFacilityModel from "../models/inspectorFacilities";

export const getAllCleaners = async () => {
  const result = await User.aggregate([
    {
      $match: { flag: 'ACTIVE' }
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
      $match: { 'user_roles.role_name': 'Cleaner' } // Match only 'Cleaner' roles
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
    },
    {
      $group: {
        _id: null, // Group all documents together
        totalCleaners: { $sum: 1 }, // Count total number of cleaners
        cleaners: { $push: '$$ROOT' } // Collect all cleaners data
      }
    },
    {
      $project: {
        _id: 0,
        totalCleaners: 1,
        cleaners: 1
      }
    }
  ]);

  return result[0] || { totalCleaners: 0, cleaners: [] }; // Return default if no cleaners found
};


export const getAllInspectors = async () => {
  const result = await User.aggregate([
    {
      $match: { flag: 'ACTIVE' }
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
      $match: { 'user_roles.role_name': 'Inspector' } // Match only 'Cleaner' roles
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
    },
    {
      $group: {
        _id: null, // Group all documents together
        totalInspectors: { $sum: 1 }, // Count total number of cleaners
        inspectors: { $push: '$$ROOT' } // Collect all cleaners data
      }
    },
    {
      $project: {
        _id: 0,
        totalInspectors: 1,
        inspectors: 1
      }
    }
  ]);

  return result[0] || { totalInspectors: 0, inspectors: [] }; // Return default if no cleaners found
};

export const managerCleaners = async (managerId: mongoose.Types.ObjectId, facilityId: string) => {
    // Step 1: Check if the manager has access to the facility
    const facilityCheck = await managerFacilityCheck(managerId, facilityId as string);
    if (!facilityCheck?.found) {
        return  { totalCleaners: 0, cleaners: [] };
    }

    // Step 2: Retrieve the assigned cleaners for the given facility
    const cleanerFacility = await CleanerFacilityModel.findOne({ facilityId: facilityId as string }).populate('assignedCleaners');

    if (!cleanerFacility) {
        return  { totalCleaners: 0, cleaners: [] };
    }

    const assignedCleaners = cleanerFacility.assignedCleaners.map(cleaner => cleaner._id);

    // Step 3: Use aggregation to get roles where role_name is "Cleaner"
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
        _id: 0, // Exclude _id from the result
        user_id: 1,
        user_name: '$userDetails.username',
        role_id: 1,
        role_name: 1
        }
    },
    {
        $group: {
        _id: null,
        totalCleaners: { $sum: 1 },
        cleaners: { $push: '$$ROOT' }
        }
    },
    {
        $project: {
        _id: 0,
        totalCleaners: 1,
        cleaners: 1
        }
    }
    ]);

    return result[0] || { totalCleaners: 0, cleaners: [] };
}

export const managerInspector = async (managerId: mongoose.Types.ObjectId, facilityId: string) => {
    const facilityCheck = await managerFacilityCheck(managerId, facilityId as string)
    if(!facilityCheck?.found){
        return  { totalInspectors: 0, inspector: [] };
    }
     // Step 1: Retrieve the assigned cleaners for the given facility
     const inspectorFacility = await InspectorFacilityModel.findOne({ facilityId: facilityId as string }).populate('assignedInspectors');

    if (!inspectorFacility) {
    return  { totalInspectors: 0, inspector: [] };
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
        },
        {
            $group: {
            _id: null,
            totalInspectors: { $sum: 1 },
            inspector: { $push: '$$ROOT' }
            }
        },
        {
            $project: {
            _id: 0,
            totalInspectors: 1,
            inspector: 1
            }
        }
    ]);
    return result[0] || { totalInspectors: 0, inspector: [] };
}