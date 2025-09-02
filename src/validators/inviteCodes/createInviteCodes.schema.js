import {z} from 'zod';

export const createInviteSchema= z.object({
    role: z.enum(['DOCTOR', 'PHARMACIST', 'LAB_TECH']),
    expiresAt: z.date().optional()
}).strict();