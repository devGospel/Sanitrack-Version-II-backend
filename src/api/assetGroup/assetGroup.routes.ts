import { Router } from "express";
import validate from "../../middlewares/validate";
import validator from "../../validator/assetGroup";
import assetController from './assetGroup.controller'

export default () => { 
    const assetRoute = Router()

    assetRoute.get('/room',  assetController.initialize)
    assetRoute.post('/create', validate(validator.createAssetGroup), assetController.createAssetGroup)
    assetRoute.get('/', assetController.getAllGroups)
    assetRoute.get('/group-detail', assetController.getGroupDetail)
    return assetRoute
}