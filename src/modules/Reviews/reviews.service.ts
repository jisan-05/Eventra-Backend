import { prisma } from "../../lib/prisma";

const REVIEW_EDIT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const createReview = async (userId: string, eventId: string, rating: number, comment: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  // Optional: check if user participated
  const participation = await prisma.participation.findFirst({
    where: { userId, eventId, status: "APPROVED" }
  });

  if (!participation && event.ownerId !== userId) {
    throw new Error("You must participate in the event to review it.");
  }

  const existingReview = await prisma.review.findFirst({
    where: { userId, eventId }
  });

  if (existingReview) {
    throw new Error("You have already reviewed this event.");
  }

  return await prisma.review.create({
    data: { userId, eventId, rating, comment }
  });
};

const getEventReviews = async (eventId: string) => {
  return await prisma.review.findMany({
    where: { eventId },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" }
  });
};

const updateReview = async (reviewId: string, userId: string, rating: number, comment: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");
  if (review.userId !== userId) throw new Error("Unauthorized");

  const elapsed = Date.now() - new Date(review.createdAt).getTime();
  if (elapsed > REVIEW_EDIT_WINDOW_MS) {
    throw new Error("Reviews can only be edited within 14 days of posting");
  }

  return await prisma.review.update({
    where: { id: reviewId },
    data: { rating, comment }
  });
};

const deleteReview = async (reviewId: string, userId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");
  if (review.userId !== userId) throw new Error("Unauthorized");

  const elapsed = Date.now() - new Date(review.createdAt).getTime();
  if (elapsed > REVIEW_EDIT_WINDOW_MS) {
    throw new Error("Reviews can only be deleted within 14 days of posting");
  }

  return await prisma.review.delete({
    where: { id: reviewId }
  });
};

const getMyReviews = async (userId: string) => {
  return await prisma.review.findMany({
    where: { userId },
    include: { event: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" }
  });
};

export const reviewsService = {
  createReview,
  getEventReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
