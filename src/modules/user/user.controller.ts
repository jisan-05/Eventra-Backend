import { Request, Response } from "express";
import { profileService } from "./user.service";


const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await profileService.getMyProfile(userId as string);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error: "get my profile failed!",
      details: error,
    });
  }
};

const getAllUser = async(req:Request,res:Response)=>{
  try {
    const result = await profileService.getAllUser()
     res.status(200).json(result);
  } catch (error) {
     res.status(400).json({
      error: "get all user profile failed!",
      details: error,
    });
  }
}

const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, image } = req.body;
    const result = await profileService.updateMyProfile(
      userId as string,
      name,
      image,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error: "update profile failed!",
      details: error,
    });
  }
};

// Soft delete user
const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Admin sends user ID in params

    if (!id) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const result = await profileService.deleteUser(id as string);

    res.status(200).json({
      success: true,
      message: "User has been soft deleted",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      error: "Failed to delete user",
      details: error,
    });
  }
};

const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: "ADMIN" | "USER" | "MANAGER" };

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        message: "User id and role are required",
      });
    }

    if (!["ADMIN", "USER", "MANAGER"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role value",
      });
    }

    const result = await profileService.updateUserRole(id as string, role);
    return res.status(200).json({
      success: true,
      message: "User role updated",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update user role",
      details: error,
    });
  }
};


export const profileController = {
  getMyProfile,
  updateMyProfile,
  deleteUser,
  getAllUser,
  updateUserRole,
};
