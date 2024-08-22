import { Router } from "express"
import roomTimer from "./roomTimer.controller"

export default () => { 
    const roomCleaningTimer = Router()

    roomCleaningTimer.get('/planned', roomTimer.getPlannedTime)
    return roomCleaningTimer
}