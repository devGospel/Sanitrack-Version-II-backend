import { String } from "aws-sdk/clients/appstream";
import mongoose from "mongoose";

interface IFacilityStage {
    name: String;
    actual_stage_start: any
    actual_stage_stop:any
    started_by: any
    stopped_by: any
}

export function getFacilityCurrentStage(facilityStages: IFacilityStage[] | any[]): string {
    for(let i = 0; i<facilityStages.length; i++){ 
        if(facilityStages[i].actual_stage_stop == null){
            return facilityStages[i].name
        }
        // if the first facility stage.actual_stage_stop is not null, look for the next one that is null but the actual_stage_start is not null
        else if (i < facilityStages.length - 1 && facilityStages[i + 1].actual_stage_stop == null && facilityStages[i + 1].actual_stage_start !== null) {
            return facilityStages[i + 1].name;
        }
    }
    // If all stages have actual_stage_stop not null, return the last stage
    return facilityStages[facilityStages.length - 1].name;
}