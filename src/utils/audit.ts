import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';

export async function logAudit(params: {
  userId?: number;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
      ipAddress: params.ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
