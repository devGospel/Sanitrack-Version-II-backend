import { Router } from "express"
import searchController from "./search.controller"

export default () => { 
    const searchRouter = Router()

    searchRouter.get('/task', searchController.handleEvidenceSearch)
    return searchRouter
}