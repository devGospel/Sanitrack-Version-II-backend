import CleaningItems from "../models/cleaningItems";
import TaskModel from "../models/task";
import User from "../models/user";
import Location from "../models/location"
import RoomModel from "../models/room"
import { createChildLogger } from "../utils/childLogger";

const moduleName = '[validateTaskAdd]'
const Logger = createChildLogger(moduleName)

const validateCleaningTask = async (
  cleaningData: any[],
  checkTask: Boolean, 
  roomId: string,
  locationId: string,
  cleaners: string[],
  inspectors: string[],
  scheduled_date: any 
): Promise<string> => {
  try {
    let result = ''

    // check if the location Id sent is correct 
    const locationCheck = await Location.findById(locationId)
    if(!locationCheck){ 
      result = 'The location Id passed is incorrect'
    }

    const roomIdCheck = await RoomModel.findById(roomId)
    if(!roomIdCheck){ 
      result = 'The roomId passed is incorrect'
    }

    await Promise.all(inspectors.map(async (inspector) => { 
      const user = await User.findById(inspector)
      if(!user){ 
        return result = 'There is no user with this id'
      }
    }))

    await Promise.all(cleaners.map(async (cleaner) => { 
      const user = await User.findById(cleaners)
      if(!user){ 
        return result = 'There is no cleaner with this id'
      }
    }))
    // Check if the quantity of the cleaning data selected is > 0.
    const quantities = await Promise.all(cleaningData.map(async (cleaningItem: any) => {
      const quantity = await CleaningItems.findById(cleaningItem.cleaning_id, 'quantity');
      return quantity?.quantity || 0;
    }));

    // Check if any item has quantity less than or equal to 0
    if (quantities.some(quantity => typeof quantity == 'number' && quantity <= 0)) {
      result = "Some cleaning items are not available";
    }

    // Check if a task has been created for the same room and location before
    // if(checkTask){
    //   const existingTask = await TaskModel.findOne({ assigned_room: roomId, assigned_location: locationId });
    //   if (existingTask) {
    //     result = "A task for this room in the specified location already exists";
    //   }
    // }
    const existingTaskForCleaner = await TaskModel.findOne({assigned_room: roomId, isSubmitted: false, assigned_location: locationId, scheduled_date: scheduled_date, assigned_cleaner: {$in: cleaners}})
    if(existingTaskForCleaner) {
      result = "This cleaner already a task for assigned for the scheduled date in the same room and location"
    } 

    const existingTaskForInspector =  await TaskModel.findOne({assigned_room: roomId, isSubmitted: false, assigned_location: locationId, scheduled_date: scheduled_date, assigned_inspector: {$in: inspectors}})
    if(existingTaskForInspector){
      result = "This inspector already has a task assigned for the scheduled date in the same room and location"
    }
    // Check if the cleaner and inspector are active
    const cleanersStatus = await Promise.all(cleaners.map(async (cleanerId: any) => {
      const cleaner = await User.findOne({ _id: cleanerId, flag: 'ACTIVE' }, 'flag');
      return cleaner ? true : false; // Return true if the cleaner is active, false otherwise
    }));

    const inspectorStatus = await Promise.all(inspectors.map(async (inspectorId: any) => {
      const inspector = await User.findOne({ _id: inspectorId, flag: 'ACTIVE' }, 'flag');
      return inspector ? true : false; // Return true if the inspector is active, false otherwise
    }));

    if (cleanersStatus.some(status => status !== true) || inspectorStatus.some(status => status !== true)) {
      result = "Attempted to assign a room to a fired employee";
    }

    // Deduct assigned cleaning items from inventory
    const insufficientStockItems: string[] = [];
    await Promise.all(cleaningData.map(async (cleaningItem: any) => {
      const cleaningItemDetail = await CleaningItems.findById(cleaningItem.cleaning_id);
      if (cleaningItemDetail) {
        const deductionQuantity = cleaningItem.quantity;

        // Cast cleaningItemDetail.quantity to number before performing arithmetic operation
        const currentQuantity = cleaningItemDetail.quantity as number;
        cleaningItemDetail.quantity = currentQuantity - deductionQuantity;

        const updatedQuantity = cleaningItemDetail.quantity as number;
        if (updatedQuantity >= 0) {
          await cleaningItemDetail.save();
        } else {
          insufficientStockItems.push(cleaningItem.item_name)
        }
      }
    }));

    if (insufficientStockItems.length > 0) {
      result = `There is not enough stock ${insufficientStockItems.join(", ")}`;
    }

    return result
  } catch (error) {
    console.error("Validation error:", error);
    return 'Something happened in the validation for creating task'; 
  }
};

export default validateCleaningTask;
