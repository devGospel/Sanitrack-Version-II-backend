import { Router } from "express"
import cleaningItemsController from "./cleaningItems.controller"
import { Roles } from "../../constant/roles";
import { requireRole } from "../../middlewares/requireRole";


export default () => { 
    const cleaningItemRouter = Router()
    // const upload = multer({ dest: 'cleaningItems/' })

    cleaningItemRouter.post('/add',  cleaningItemsController.addCleaningItem);
    cleaningItemRouter.get('/',  cleaningItemsController.getCleaningItem)
    cleaningItemRouter.get('/single',  cleaningItemsController.getSingleItem)
    cleaningItemRouter.delete('/delete',  cleaningItemsController.deleteCleaningItem)
    cleaningItemRouter.put('/edit',  cleaningItemsController.updateCleaningItem)
    
    return cleaningItemRouter
}