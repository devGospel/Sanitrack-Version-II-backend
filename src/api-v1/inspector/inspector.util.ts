import mongoose from "mongoose";
import { getCurrentDateInLosAngeles, getCurrentDateInLosAngelesFormatted } from "../../utils/date";
import InspectorEvidenceModel from "../../models/inspectorEvidenceNew";



// Helper function to check and update evidence if it exists, otherwise insert a new document
export const insertEvidence = async(workOrderId: string, workOrderTaskId: string, inspector: string, imageUploaded: Boolean, newImage?: any, note?: string) => {
    const date = getCurrentDateInLosAngelesFormatted(); // Format as YYYY-MM-DD


    // console.log(`the work order task id is => ${workOrderTaskId}`)
    // Find the existing evidence for the same workOrderId, assetId, and date
    const existingEvidence = await InspectorEvidenceModel.findOne({
        workOrderId: workOrderId, 
        workOrderTaskId: workOrderTaskId, 
        inspector: inspector,
        $or: [
            { 'evidence.images.uploadedAt': { $gte: new Date(`${date}T00:00:00.000Z`), $lte: new Date(`${date}T23:59:59.999Z`) } },
            { 'evidence.notes.uploadedAt': { $gte: new Date(`${date}T00:00:00.000Z`), $lte: new Date(`${date}T23:59:59.999Z`) } }
        ]
    });

    // console.log(`existing => ${existingEvidence}`)
    // console.log(`the inspector is ${inspector}`)
    if (!existingEvidence) {
         // Create a new document if no existing evidence is found
         const newEvidence = {
            workOrderId,
            workOrderTaskId,
            inspector,
            evidence: {
                images: imageUploaded?  [newImage]: [], // Store the image in the evidence object
                notes: note ? [{ note, uploadedAt: getCurrentDateInLosAngeles() }] : []
            },
        };
        const createdEvidence = await InspectorEvidenceModel.create(newEvidence)
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
                uploadedAt: uploadDate  //idk why this bitch needs to be this way. If you figure it out,congrats
            });
        }

        await existingEvidence.save(); // Save the updated document
        return existingEvidence._id; // Return the _id of the updated document
    }
}

