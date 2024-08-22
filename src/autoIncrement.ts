import mongoose from "mongoose";
import  modelPrefix  from "./constant/codes";
import TeamModel from "./models/teams";
import { MONGODB_URI } from "./constant/dburl";
import RoomModel from "./models/room";
import { formatCode } from "./utils/formatCode";


export async function initializeTeamCodes() {
    const items = await TeamModel.find({ teamCode: { $exists: false } });
    for (let i = 0; i < items.length; i++) {
        items[i].teamCode = i +  1 as unknown as String
        items[i].teamPrefix = modelPrefix.teamPrefix;
        await items[i].save();
    }
    
    console.log('Initialized teamPrefix for all items.');
}

export async function initializeRoomCodes(){ 
    const items = await RoomModel.find()
    for(let i = 0; i < items.length; i++){ 
        items[i].roomCode = formatCode( i + 1) as unknown as String
        items[i].roomPrefix = modelPrefix.roomPrefix
        await items[i].save()
    }
    console.log('Rooms initialized for all existing items')
}