import mongoose from "mongoose";
import { getCurrentDateInLosAngeles, getCurrentDateInLosAngelesFormatted } from "./date";

export  function isOverDue(expiry_time: any, last_cleaned: { type: mongoose.Schema.Types.Date; default: null; } | null) {
    const current_date = new Date();
    // Assuming cleaning_expiry_time is a property of each task
    const cleaning_expiry_time = expiry_time ? expiry_time as Date : null; 
    if (cleaning_expiry_time == null) return 'No expiry time for item';
    
    if (last_cleaned == null) {
        // If last cleaned is null, check if the current date is greater than the cleaning expiry time
        return (current_date > cleaning_expiry_time) ? 'Yes' : 'No';
    } else {
        // If last cleaned is not null, the item is not overdue
        return 'No';
    }
}

export function updatedIsOverDue(validCleaningDuration: any, last_cleaned: Date | undefined, cleanerDone:Boolean, inspectorApproved:Boolean ){ 
    const currentDate = getCurrentDateInLosAngeles()
    if(last_cleaned == null){ 
        return (currentDate > validCleaningDuration) ? 'Yes' : 'No'
    }else{ 
        // since it is not null, it means it has been cleaned so check if the isDone and isApproved are false
        if(!inspectorApproved || !cleanerDone){
            return 'Yes'
        }else{ 
            return 'No'
        }
      
    }
}