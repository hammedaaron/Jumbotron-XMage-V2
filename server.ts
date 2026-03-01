import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

export const prisma = new PrismaClient();

export async function createServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Sync User from Supabase to Prisma
  app.post("/api/auth/sync", async (req, res) => {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: "No user data" });

    try {
      const dbUser = await prisma.user.upsert({
        where: { xUserId: user.id },
        update: {
          username: user.user_metadata.full_name || user.email,
          handle: user.user_metadata.user_name || user.email.split('@')[0],
        },
        create: {
          xUserId: user.id,
          username: user.user_metadata.full_name || user.email,
          handle: user.user_metadata.user_name || user.email.split('@')[0],
        },
      });
      res.json(dbUser);
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Community Routes
  app.get("/api/communities", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const communities = await prisma.community.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: true,
      }
    });
    res.json(communities);
  });

  app.post("/api/communities", async (req, res) => {
    const { name, bio, ownerId } = req.body;
    try {
      const community = await prisma.$transaction(async (tx) => {
        const c = await tx.community.create({
          data: { name, bio, ownerId },
        });
        await tx.communityMember.create({
          data: {
            communityId: c.id,
            userId: ownerId,
            role: "admin",
          },
        });
        return c;
      });
      res.json(community);
    } catch (error) {
      res.status(500).json({ error: "Failed to create community" });
    }
  });

  // Session Routes
  app.get("/api/communities/:communityId/sessions", async (req, res) => {
    const { communityId } = req.params;
    const sessions = await prisma.session.findMany({
      where: { communityId },
      orderBy: { startTime: "asc" },
    });
    res.json(sessions);
  });

  app.post("/api/communities/:communityId/sessions", async (req, res) => {
    const { communityId } = req.params;
    const { name, startTime, endTime, graceEndTime, userId } = req.body;

    // Check admin role
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });

    if (!member || member.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create sessions" });
    }

    // Phase 5: Plan Enforcement
    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (community?.planType === "trial") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const sessionCount = await prisma.session.count({
        where: {
          communityId,
          createdAt: { gte: startOfMonth }
        }
      });
      
      if (sessionCount >= 3) {
        return res.status(403).json({ error: "Trial plan limit reached (3 sessions/month). Upgrade to Pro for unlimited sessions." });
      }
    }

    try {
      const session = await prisma.session.create({
        data: {
          communityId,
          name,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          graceEndTime: new Date(graceEndTime),
          status: "scheduled",
        },
      });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Simple Upgrade Endpoint (Manual for now)
  app.post("/api/communities/:communityId/upgrade", async (req, res) => {
    const { communityId } = req.params;
    try {
      const community = await prisma.community.update({
        where: { id: communityId },
        data: { planType: "pro", subscriptionStatus: "active" }
      });
      res.json(community);
    } catch (error) {
      res.status(500).json({ error: "Failed to upgrade community" });
    }
  });

  const calculateGrade = (count: number) => {
    if (count >= 10) return "A";
    if (count >= 7) return "B";
    if (count >= 4) return "C";
    if (count >= 1) return "D";
    return "F";
  };

  app.get("/api/sessions/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    
    try {
      let session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          participants: {
            include: { user: true }
          }
        }
      });

      if (!session) return res.status(404).json({ error: "Session not found" });

      // Auto-finalization logic (Phase 3 & 4)
      const now = new Date();
      if (now > session.endTime && session.status !== "completed") {
        session = await prisma.$transaction(async (tx) => {
          // Update all participants with grades and handle ban logic (Phase 4)
          for (const p of session!.participants) {
            const grade = calculateGrade(p.engagedWithCount);
            await tx.sessionParticipant.update({
              where: { id: p.id },
              data: { grade }
            });

            // Ban Automation Logic
            if (grade === "F") {
              const member = await tx.communityMember.findUnique({
                where: { communityId_userId: { communityId: session!.communityId, userId: p.userId } }
              });

              if (member) {
                let { blacklistCount, softBanCount, hardBanCount, isPermanentlyBanned } = member;
                
                blacklistCount += 1;
                if (blacklistCount >= 3) {
                  blacklistCount = 0;
                  softBanCount += 1;
                }
                if (softBanCount >= 2) {
                  softBanCount = 0;
                  hardBanCount += 1;
                }
                if (hardBanCount >= 2) {
                  isPermanentlyBanned = true;
                }

                await tx.communityMember.update({
                  where: { id: member.id },
                  data: { blacklistCount, softBanCount, hardBanCount, isPermanentlyBanned }
                });
              }
            }
          }
          // Mark session as completed
          return await tx.session.update({
            where: { id: sessionId },
            data: { status: "completed" },
            include: {
              participants: {
                include: { user: true }
              }
            }
          });
        });
      }

      res.json(session);
    } catch (error) {
      console.error("Session fetch error:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions/:sessionId/engage", async (req, res) => {
    const { sessionId } = req.params;
    const { engagerId, targetId } = req.body;

    if (engagerId === targetId) return res.status(400).json({ error: "Cannot engage self" });

    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session || session.status === "completed") {
        return res.status(400).json({ error: "Session is not active" });
      }

      // Anti-spam: Check if already engaged in this session
      const existingLog = await prisma.engagementLog.findFirst({
        where: { sessionId, engagerId, targetId }
      });

      if (existingLog) {
        return res.status(400).json({ error: "Already engaged with this user in this session" });
      }

      await prisma.$transaction([
        prisma.engagementLog.create({
          data: { sessionId, engagerId, targetId }
        }),
        prisma.sessionParticipant.update({
          where: { sessionId_userId: { sessionId, userId: engagerId } },
          data: { engagedWithCount: { increment: 1 } }
        }),
        prisma.sessionParticipant.update({
          where: { sessionId_userId: { sessionId, userId: targetId } },
          data: { engagedByCount: { increment: 1 } }
        })
      ]);

      res.json({ success: true });
    } catch (error) {
      console.error("Engage error:", error);
      res.status(500).json({ error: "Failed to engage" });
    }
  });

  app.post("/api/sessions/:sessionId/join", async (req, res) => {
    const { sessionId } = req.params;
    const { userId } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    const now = new Date();
    if (now < session.startTime || now > session.endTime) {
      return res.status(400).json({ error: "Session is not active" });
    }

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: session.communityId, userId } },
    });

    if (!member) return res.status(403).json({ error: "Not a community member" });
    if (member.isPermanentlyBanned) return res.status(403).json({ error: "Banned from community" });

    try {
      const participant = await prisma.sessionParticipant.upsert({
        where: { sessionId_userId: { sessionId, userId } },
        update: {},
        create: {
          sessionId,
          userId,
          engagedWithCount: 0,
          engagedByCount: 0,
        },
      });
      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: "Failed to join session" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  return app;
}

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}` || process.env.NODE_ENV === 'development') {
  createServer().then(app => {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
