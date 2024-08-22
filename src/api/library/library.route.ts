import { Router } from "express"
import { permissionCheck, middleware } from "../../middlewares/security"
import { s3Config, uploadTrainingResource } from "../../middlewares/UploadToAWSBucket";
import libraryController from "./library.controller"


export default () => { 
    const libraryRouter = Router()

    libraryRouter.post("/resource/create", uploadTrainingResource, libraryController.createLibraryResource)
    libraryRouter.get("/resources/all", libraryController.getAllLibraryResources)
    libraryRouter.get("/resource/:resourceId", libraryController.getLibraryResourceById)
    libraryRouter.patch("/resource/:resourceId/update", uploadTrainingResource, libraryController.updateLibraryResourceById)
    libraryRouter.delete("/resource/:resourceId/delete", libraryController.deleteLibraryResource)
    libraryRouter.get("/resource/training/personalized", libraryController.getUserLibraryResources)
   
    return libraryRouter;
}
