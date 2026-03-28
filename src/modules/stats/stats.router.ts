import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";

const router = Router();

const EVENT_TYPES = [
  "PUBLIC_FREE",
  "PUBLIC_PAID",
  "PRIVATE_FREE",
  "PRIVATE_PAID",
] as const;

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [
      totalEvents,
      totalParticipationsApproved,
      totalUsers,
      totalReviews,
      activeUsers,
      adminUsers,
      regularUsers,
      participationsPending,
      participationsRejected,
      participationsBanned,
      paymentSuccessStats,
      eventsByTypeRows,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.participation.count({ where: { status: "APPROVED" } }),
      prisma.user.count(),
      prisma.review.count(),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false, role: "ADMIN" } }),
      prisma.user.count({ where: { isDeleted: false, role: "USER" } }),
      prisma.participation.count({ where: { status: "PENDING" } }),
      prisma.participation.count({ where: { status: "REJECTED" } }),
      prisma.participation.count({ where: { status: "BANNED" } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.event.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
    ]);

    const avgRatingResult = await prisma.review.aggregate({
      _avg: { rating: true },
    });

    const eventsByType: Record<string, number> = {};
    for (const t of EVENT_TYPES) {
      eventsByType[t] = 0;
    }
    for (const row of eventsByTypeRows) {
      eventsByType[row.type] = row._count._all;
    }

    res.json({
      success: true,
      data: {
        totalEvents,
        totalParticipations: totalParticipationsApproved,
        totalUsers,
        totalReviews,
        avgRating: Number((avgRatingResult._avg.rating ?? 0).toFixed(1)),
        activeUsers,
        adminUsers,
        regularUsers,
        deletedUsers: totalUsers - activeUsers,
        participationsPending,
        participationsRejected,
        participationsBanned,
        successfulPaymentsCount: paymentSuccessStats._count._all,
        revenueTotal: Number((paymentSuccessStats._sum.amount ?? 0).toFixed(2)),
        eventsByType,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ success: false, message: msg });
  }
});

export const statsRoutes = router;
