import { z } from 'zod';

export const communitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  bio: z.string().optional(),
});

export const sessionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  graceEndTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const grace = new Date(data.graceEndTime);
  return start < end && end <= grace;
}, {
  message: "Times must be sequential: Start < End <= Grace",
  path: ["startTime"], // General error path
});

export type CommunityFormValues = z.infer<typeof communitySchema>;
export type SessionFormValues = z.infer<typeof sessionSchema>;

export interface User {
  id: string;
  xUserId: string;
  username: string;
  handle: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  bio: string | null;
  ownerId: string;
  planType: string;
  createdAt: string;
  owner?: User;
}

export interface Session {
  id: string;
  communityId: string;
  name: string;
  startTime: string;
  endTime: string;
  graceEndTime: string;
  status: string;
  createdAt: string;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  engagedWithCount: number;
  engagedByCount: number;
  grade: string | null;
  createdAt: string;
  user?: User;
}
