import { Request, Response, NextFunction } from 'express';
import User from './user.model';

// ─── GET All Users (Admin Only) ─────────────────────────────────────────────
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find().select('-__v');
    const count = await User.countDocuments();

    res.status(200).json({
      success: true,
      count,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET Single User (Admin Only) ───────────────────────────────────────────
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST Create User (Admin Only) ──────────────────────────────────────────
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role, phone, isVerified, isActive } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already exists' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
      phone,
      isVerified: isVerified !== undefined ? isVerified : true, // Default to true for admin-created
      isActive: isActive !== undefined ? isActive : true, // Default to true for admin-created
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH Update User (Admin Only) ─────────────────────────────────────────
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // We don't allow password updates through this general update route
    // Admin should use a specific password reset route if needed
    const { name, phone, role, isVerified, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, role, isVerified, isActive },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};





// ─── DELETE User (Admin Only) ───────────────────────────────────────────────
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
