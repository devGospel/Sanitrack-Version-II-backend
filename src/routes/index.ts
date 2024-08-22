import { Router } from "express";
import routeV1 from './v1/index'
import routes from './api/index'

const router = Router()

router.use('/api/v1', routeV1())

router.use('/api', routes())

export default router