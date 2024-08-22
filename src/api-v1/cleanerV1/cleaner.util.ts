import mongoose from "mongoose";
import CleanerEvidenceModel from "../../models/cleanerEvidence";
import { getCurrentDateInLosAngeles, getCurrentDateInLosAngelesFormatted } from "../../utils/date";



// Helper function to check and update evidence if it exists, otherwise insert a new document
export const insertEvidence = async(workOrderId: string, workOrderTaskId: string, cleaner: string, imageUploaded: Boolean, newImage?: any, note?: string) => {
    const date = getCurrentDateInLosAngelesFormatted(); // Format as YYYY-MM-DD


    // console.log(`the work order task id is => ${workOrderTaskId}`)
    // Find the existing evidence for the same workOrderId, assetId, and date
    const existingEvidence = await CleanerEvidenceModel.findOne({
        workOrderId: workOrderId, 
        workOrderTaskId: workOrderTaskId, 
        cleaner: cleaner,
        $or: [
            { 'evidence.images.uploadedAt': { $gte: new Date(`${date}T00:00:00.000Z`), $lte: new Date(`${date}T23:59:59.999Z`) } },
            { 'evidence.notes.uploadedAt': { $gte: new Date(`${date}T00:00:00.000Z`), $lte: new Date(`${date}T23:59:59.999Z`) } }
        ]
    });

    // console.log(`existing => ${existingEvidence}`)
    if (!existingEvidence) {
         // Create a new document if no existing evidence is found
         const newEvidence = {
            workOrderId,
            workOrderTaskId,
            cleaner,
            evidence: {
                images: imageUploaded?  [newImage]: [], // Store the image in the evidence object
                notes: note ? [{ note, uploadedAt: getCurrentDateInLosAngeles() }] : []
            },
        };
        const createdEvidence = await CleanerEvidenceModel.create(newEvidence)
        return createdEvidence._id;
    } else {
       // Ensure evidence array and images array are initialized
       if (!existingEvidence.evidence) {
            existingEvidence.evidence = { images: [], notes: [] , videos: []};
        }

        // Check if the first element of evidence has images and notes array
        if (!existingEvidence.evidence?.images) {
            existingEvidence.evidence.images = [];
        }
        if (!existingEvidence.evidence?.notes) {
            existingEvidence.evidence.notes = [];
        }

        // Push new image into the existing evidence
        if(imageUploaded){ 
            existingEvidence.evidence.images.push(newImage)
        }
        
        // Add the note if it is provided and not already present
        if (note && !existingEvidence.evidence.notes.some(existingNote => existingNote.note === note)) {
            const uploadDate = getCurrentDateInLosAngeles()
            existingEvidence.evidence.notes.push({
                note,
                uploadedAt: uploadDate as unknown as mongoose.Schema.Types.Date //idk why this bitch needs to be this way. If you figure it out,congrats
            });
        }

        await existingEvidence.save(); // Save the updated document
        return existingEvidence._id; // Return the _id of the updated document
    }
}

