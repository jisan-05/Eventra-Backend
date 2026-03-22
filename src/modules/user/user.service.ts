import { prisma } from "../../lib/prisma";

const getMyProfile = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  return result;
};

const getAllUser = async()=>{
  const result = await prisma.user.findMany()
  return result
}

const updateMyProfile = async (userId: string, name: string, image: string) => {
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name,
      image: image,
    },
  });
  return result;
};

const deleteUser = async (userId: string) => {
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
    },
  });

  return result;
};


export const profileService = {
  getMyProfile,
  getAllUser,
  updateMyProfile,
  deleteUser,

};
