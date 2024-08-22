import cloudinary from "../../config/cloudinary"
import customResponse from "../../helpers/response"
import { Request, Response } from "express"
import CleaningItems from "../../models/cleaningItems"
import { AuthenticatedRequest } from "../../middlewares/security"
import {cleaningData} from "../../types/interface"
import { UploadToS3 } from "../../utils/aws"
import { createChildLogger } from "../../utils/childLogger";

const moduleName = '[cleaningItems/controller]'
const Logger = createChildLogger(moduleName)

const addCleaningItem = async(req:AuthenticatedRequest, res: Response) => { 
    try{
        const {name, description, type, quantity, unit, location_id} = req.body
        // Logger.info(name)
        // let uploadedImage
//        // check if the equipment that wants to be created has been added before 
        const equipment = name.toLowerCase()
        const existingEquipment = await CleaningItems.find({equipment: equipment})

        if(existingEquipment.length > 0) return customResponse.badRequestResponse('An equipment already exists', res)

        // const files = req.file as Express.Multer.File
        // if (files) {
        //     Logger.info(`file name => ${files.buffer}`)
            
        //     if(files.buffer == undefined){throw new Error("undefined buffer")}
        //     try {
        //     const imageData = files.buffer;
        //     const imageFileName = files.originalname;

        //     const imageKey = `cleaningItems/${name}/${imageFileName}`;
        //     const imageUrl = await UploadToS3(imageData, imageKey);

        //     uploadedImage = imageUrl
        //     } catch (error) {
        //     console.error('Error uploading file to S3:', error);
        //     // Handle the error appropriately, maybe skip this file and continue with others
        //     }
            
        // }
        const quantityToInt = parseInt(quantity)
        let cleaningItems = {};
        if (location_id !== null) { 
         
            cleaningItems = await CleaningItems.create({
            equipment: name, 
            description: description, 
            quantity: quantityToInt, 
            type: type,
            unit: unit 
            });

        } else {
             
            cleaningItems = await CleaningItems.create({
                equipment: name, 
                description: description, 
                quantity: quantityToInt, 
                type: type,
                unit: unit, 
                location_id: location_id
            });
        }

         return customResponse.successResponse('added successfully', cleaningItems, res)
     }catch(error:any){ 
        Logger.error('An error occurred in the add cleaning items route', error)
         return customResponse.serverErrorResponse('An error occurred when adding cleaning items', res, error)
     }
    
 }

 const getCleaningItem = async(req:AuthenticatedRequest, res:Response) => { 
     try{
         const itemQuery = CleaningItems.find().sort({ _id: -1 });

         const [totalItems, allItems] = await Promise.all([
             CleaningItems.countDocuments(),
             itemQuery.exec(),
         ]);
    
         // Prepare data to send in the response
         const data = {
             totalItems,
             allItems,
         };
    
         return customResponse.successResponse(
           "Get all cleaning items successful",
           data,
           res
         );
     }catch(error: any){ 
         return customResponse.serverErrorResponse('An error occurred', res, error)
     }
    
 }


 const getCleaningItemByFacility = async(req:AuthenticatedRequest, res:Response) => { 
    try{
        const facility_id = req.params.facility_id
        const results = CleaningItems.find({location_id: facility_id}).sort({ _id: -1 });

        return customResponse.successResponse(
          `all cleaning items for ${facility_id}`,
          results,
          res
        );
    }catch(error: any){ 
        return customResponse.serverErrorResponse('An error occurred', res, error)
    }
   
}

 const getSingleItem = async(req: AuthenticatedRequest, res:Response) =>{ 
     try{
         const itemId = req.query.itemId;
         if(!itemId) return customResponse.badRequestResponse("Enter an Id", res)
      
         const cleaningItem = await CleaningItems.findById({ _id: itemId }).exec();
      
         if (!cleaningItem) {
           return customResponse.badRequestResponse("There is no cleaning Item with the id",res);
         }
      
         return customResponse.successResponse("cleaning Item retrieved successfully", cleaningItem, res);
     }catch(error:any){ 
         return customResponse.serverErrorResponse('An error occurred', res, error)
     }
 }

 const updateCleaningItem = async(req:AuthenticatedRequest, res:Response) => { 
     try{
            const { name, description, type, quantity, image_path, pairs, unit, location_id} = req.body
            const {itemId} = req.query

            if(!itemId) return customResponse.badRequestResponse('The item id is required', res)
            const existingItem = await CleaningItems.findById(itemId);
            if(!existingItem) return customResponse.badRequestResponse('A cleaning item with that id does not exist', res)
            existingItem.equipment = name ?? existingItem.equipment;
            existingItem.description = description ?? existingItem.description;
            existingItem.quantity = quantity ??   existingItem.quantity;
            existingItem.type = type ?? existingItem.type;
            existingItem.pairs = pairs ?? existingItem.pairs;
            existingItem.unit = unit ?? existingItem.unit;
            existingItem.image = image_path ?? existingItem.image;
            existingItem.location_id = location_id ?? existingItem.location_id;

            await existingItem.save();

            return customResponse.successResponse('Cleaning item updated', existingItem, res)
        }catch(error: any){ 
            return customResponse.serverErrorResponse('An error occurred in the update cleaning item endpoint', res, error)
        }
 }

 const deleteCleaningItem = async(req:AuthenticatedRequest, res: Response) => {
     // receive an array of cleaningItem ids  //[{id:65cb988b595f6ac370486712, name: 'cleaning glove'}]
     try {
         const {cleaningItemsData} = req.body;

         // Delete items from Cloudinary and database in parallel
         await Promise.all(cleaningItemsData.map(async (dataToDelete: cleaningData) => {
             // Remove from Cloudinary
             await cloudinary.uploader.destroy(`cleaning_items/${dataToDelete.item_name}`);

             // Remove from the database
             await CleaningItems.deleteOne({ _id: dataToDelete.cleaning_id });
         }));

         return customResponse.successResponse("Cleaning item deleted successfully", {}, res)
     } catch (error:any) {
         return customResponse.serverErrorResponse('An error occurred in the delete cleaning item', res, error)
     }
    
 }

export default { 
    addCleaningItem, 
    getCleaningItem, 
    getSingleItem,
    updateCleaningItem,
    deleteCleaningItem
}