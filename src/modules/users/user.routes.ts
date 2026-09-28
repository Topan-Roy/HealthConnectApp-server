import { Router } from 'express';
import * as userController from './user.controller';
import { protect, authorizeRoles } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all user routes - must be logged in
router.use(protect);

// Restrict all user routes below to admin only
router.use(authorizeRoles('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
