import mongoose, { Document, Schema, model, Types, Date } from "mongoose";
import User from "./user";
import FacilityWorkOrderModel from "./workFacility";

interface FacilityTimer extends Document {
  work_order_facility: mongoose.Types.ObjectId;
  stages: [
    {
      _id: any;
      name: String;
      actual_stage_start_time: Date;
      actual_stage_stop_time: Date;
      started_by: mongoose.Types.ObjectId, 
      stoped_by: mongoose.Types.ObjectId
    }
  ];
}

const facilityTimerSchema = new Schema<FacilityTimer>({
  work_order_facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: FacilityWorkOrderModel,
    required: true,
  },
  stages: [
    {
      name: { type: String, required: true },
      actual_stage_start_time: { type: Date, required: false, default: null },
      actual_stage_stop_time: { type: Date, required: false, default: null },
      started_by:  { type: mongoose.Schema.Types.ObjectId, required: false, ref: User, default: null }, 
      stoped_by:  { type:  mongoose.Schema.Types.ObjectId, required: false, ref: User , default: null}, 
    },
  ],
});

const FacilityTimerModel = model<FacilityTimer>(
  "facility_timer",
  facilityTimerSchema
);

export default FacilityTimerModel;
