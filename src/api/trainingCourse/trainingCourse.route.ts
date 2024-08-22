import { Router } from "express";
import { permissionCheck, middleware } from "../../middlewares/security";
import { s3Config, uploadTrainingResource } from "../../middlewares/UploadToAWSBucket";
import training from './trainingCourse.controller';

export default () => { 
    const trainingRouter = Router();

    trainingRouter.post("/create", training.createTraining);
    trainingRouter.get("/all", training.getAllTrainings);
    trainingRouter.get("/:trainingId/", training.getTrainingById);
    trainingRouter.patch("/:trainingId/update", training.updateTraining);
    trainingRouter.delete("/:trainingId/delete", training.deleteTraining);
    trainingRouter.get("/creator/dashboard", training.trainingAdminDashboard);
    trainingRouter.get("/status/:trainingId/", training.getTeamAndMembersStatus);
    trainingRouter.get("/team/status/all", training.getAllTeamsAndMembersStatus);
    trainingRouter.get("/user/dashboard", training.userDashboardStatistics);
    trainingRouter.get("/teams", training.getUserTeamTrainings);
    trainingRouter.put('/remark/update', training.updateRemark);
    trainingRouter.put('/status/update', training.updateStatus);
    trainingRouter.get('/users/status', training.getAllTrainingsWithUserStatus);
    trainingRouter.get('/list/users', training.listUsersTrainingsInTable);
    trainingRouter.get('/individual/all', training.getAllTrainingIndividuals);
    trainingRouter.get('/:trainingId/individual/all', training.getAllIndividualsForATraining);

    return trainingRouter;
};