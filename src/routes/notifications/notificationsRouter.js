import { Router } from "express";
const router= Router();

//controllers import
import {getAllNotifications, confirmNotification} from '../../controllers/notifications/notificationsController.js';

//route definitions
router.get('/', getAllNotifications);
router.patch('/:id', confirmNotification);

export default router;