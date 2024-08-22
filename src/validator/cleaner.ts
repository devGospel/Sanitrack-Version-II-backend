import { Types } from "mongoose";

export interface CleanerRoomDetails {
    roomId: string;
    roomName: string;
    location: string;
}
export interface TaskWithRoomDetails {
    id: Types.ObjectId,
    assigned_room: {
        _id: Types.ObjectId;
        roomName: string;
        location: string;
        scheduled_date: Date;
    };
}
