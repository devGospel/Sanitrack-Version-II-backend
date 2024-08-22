import RoomModel from '../models/room';
import { createChildLogger } from "../utils/childLogger";

const moduleName = '[roomService]'
const Logger = createChildLogger(moduleName)


const getRoom = async (roomId: any) => {
    // try {
    //     const room = await RoomModel.findById(roomId).populate('detail');
    //     if(!room) {
    //         return {
    //             status: false,
    //             message: 'Room not found'
    //         }
    //     }
    //     return {
    //         status: true,
    //         message: 'Room found',
    //         data: JSON.parse(JSON.stringify(room.detail))
    //     }
    // } catch (error) {
    //     console.log(error)
    //     return {
    //         status: false,
    //         message: 'Something went wrong when getting the room by ID'
    //     }
    // }
}
const roomByLocationId = async(locationId: any) => { 
    // try{ 
    //     const room = await RoomModel.find({location_id: locationId}).populate('detail');
    //     if(!room) {
    //         return {
    //             status: false,
    //             message: 'Room not found'
    //         }
    //     }
    //     return {
    //         status: true,
    //         message: 'Room found',
    //         data: JSON.parse(JSON.stringify(room.map(rooms => rooms.detail)))
    //     }
    // }catch (err: any) {
    //     Logger.error(err)
    //     return {
    //         status: false, 
    //         message: 'Something went wrong when getting the room by location Id'
    //     }
    // }
}
export default {
    getRoom, 
    roomByLocationId  
};
