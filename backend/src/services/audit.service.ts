import { db } from '../db/index';
import { auditLog } from '../db/schema';
import { eq, desc, and, gte, lte, or } from 'drizzle-orm';

export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'research_add';

export interface AuditEntry {
  entityType: string;
  entityId: string;
  entityName?: string;
  action: AuditAction;
  actor: string;
  reason?: string;
  previousState?: any;
  newState?: any;
  dependencyContext?: any;
  metadata?: any;
}

export interface AuditQueryOptions {
  entityType?: string;
  entityId?: string;
  actor?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditHistoryResult {
  entries: any[];
  totalCount: number;
  hasMore: boolean;
}

export class AuditService {
  /**
   * Log a change to an entity
   */
  static async log(entry: AuditEntry): Promise<void> {
    try {
      await db.insert(auditLog).values({
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityName: entry.entityName || null,
        action: entry.action,
        actor: entry.actor,
        reason: entry.reason || null,
        previousState: entry.previousState ? JSON.parse(JSON.stringify(entry.previousState)) : null,
        newState: entry.newState ? JSON.parse(JSON.stringify(entry.newState)) : null,
        dependencyContext: entry.dependencyContext ? JSON.parse(JSON.stringify(entry.dependencyContext)) : null,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : null,
      });

      console.log(`✓ Audit log created: ${entry.action} on ${entry.entityType} ${entry.entityId} by ${entry.actor}`);
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - audit logging should not break main operations
    }
  }

  /**
   * Log a create action
   */
  static async logCreate(
    entityType: string,
    entityId: string,
    entityName: string,
    actor: string,
    newState: any,
    metadata?: any
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      entityName,
      action: 'create',
      actor,
      newState,
      metadata,
    });
  }

  /**
   * Log an update action
   */
  static async logUpdate(
    entityType: string,
    entityId: string,
    entityName: string,
    actor: string,
    previousState: any,
    newState: any,
    reason?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      entityName,
      action: 'update',
      actor,
      reason,
      previousState,
      newState,
      metadata,
    });
  }

  /**
   * Log a delete action
   */
  static async logDelete(
    entityType: string,
    entityId: string,
    entityName: string,
    actor: string,
    previousState: any,
    reason?: string,
    dependencyContext?: any,
    metadata?: any
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      entityName,
      action: 'delete',
      actor,
      reason,
      previousState,
      dependencyContext,
      metadata,
    });
  }

  /**
   * Log a status change action
   */
  static async logStatusChange(
    entityType: string,
    entityId: string,
    entityName: string,
    actor: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      entityName,
      action: 'status_change',
      actor,
      reason,
      previousState: { status: oldStatus },
      newState: { status: newStatus },
      metadata,
    });
  }

  /**
   * Log a research addition action (Claude AI)
   */
  static async logResearchAdd(
    entityType: string,
    entityId: string,
    entityName: string,
    actor: string,
    researchData: any,
    metadata?: any
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      entityName,
      action: 'research_add',
      actor,
      newState: researchData,
      metadata,
    });
  }

  /**
   * Get audit history for a specific entity
   */
  static async getEntityHistory(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const entries = await db.query.auditLog.findMany({
        where: and(
          eq(auditLog.entityType, entityType),
          eq(auditLog.entityId, entityId)
        ),
        orderBy: [desc(auditLog.createdAt)],
        limit,
      });

      return entries;
    } catch (error) {
      console.error('Error fetching entity history:', error);
      return [];
    }
  }

  /**
   * Get recent changes by a specific actor
   */
  static async getActorHistory(actor: string, limit: number = 50): Promise<any[]> {
    try {
      const entries = await db.query.auditLog.findMany({
        where: eq(auditLog.actor, actor),
        orderBy: [desc(auditLog.createdAt)],
        limit,
      });

      return entries;
    } catch (error) {
      console.error('Error fetching actor history:', error);
      return [];
    }
  }

  /**
   * Get all changes of a specific action type
   */
  static async getActionHistory(action: AuditAction, limit: number = 50): Promise<any[]> {
    try {
      const entries = await db.query.auditLog.findMany({
        where: eq(auditLog.action, action),
        orderBy: [desc(auditLog.createdAt)],
        limit,
      });

      return entries;
    } catch (error) {
      console.error('Error fetching action history:', error);
      return [];
    }
  }

  /**
   * Advanced query with multiple filters
   */
  static async query(options: AuditQueryOptions): Promise<AuditHistoryResult> {
    try {
      const conditions = [];

      if (options.entityType) {
        conditions.push(eq(auditLog.entityType, options.entityType));
      }

      if (options.entityId) {
        conditions.push(eq(auditLog.entityId, options.entityId));
      }

      if (options.actor) {
        conditions.push(eq(auditLog.actor, options.actor));
      }

      if (options.action) {
        conditions.push(eq(auditLog.action, options.action));
      }

      if (options.startDate) {
        conditions.push(gte(auditLog.createdAt, options.startDate));
      }

      if (options.endDate) {
        conditions.push(lte(auditLog.createdAt, options.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const entries = await db.query.auditLog.findMany({
        where: whereClause,
        orderBy: [desc(auditLog.createdAt)],
        limit: limit + 1, // Fetch one extra to check if there are more
        offset,
      });

      const hasMore = entries.length > limit;
      const results = hasMore ? entries.slice(0, limit) : entries;

      return {
        entries: results,
        totalCount: results.length,
        hasMore,
      };
    } catch (error) {
      console.error('Error querying audit log:', error);
      return {
        entries: [],
        totalCount: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get recent activity across all entities
   */
  static async getRecentActivity(limit: number = 50): Promise<any[]> {
    try {
      const entries = await db.query.auditLog.findMany({
        orderBy: [desc(auditLog.createdAt)],
        limit,
      });

      return entries;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Get activity summary for a date range
   */
  static async getActivitySummary(startDate: Date, endDate: Date): Promise<any> {
    try {
      const entries = await db.query.auditLog.findMany({
        where: and(
          gte(auditLog.createdAt, startDate),
          lte(auditLog.createdAt, endDate)
        ),
      });

      // Group by action type
      const byAction: Record<string, number> = {};
      const byEntityType: Record<string, number> = {};
      const byActor: Record<string, number> = {};

      entries.forEach((entry) => {
        byAction[entry.action] = (byAction[entry.action] || 0) + 1;
        byEntityType[entry.entityType] = (byEntityType[entry.entityType] || 0) + 1;
        byActor[entry.actor] = (byActor[entry.actor] || 0) + 1;
      });

      return {
        totalChanges: entries.length,
        byAction,
        byEntityType,
        byActor,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      return {
        totalChanges: 0,
        byAction: {},
        byEntityType: {},
        byActor: {},
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    }
  }

  /**
   * Get all deletes with dependency context
   */
  static async getDeletesWithDependencies(limit: number = 50): Promise<any[]> {
    try {
      const entries = await db.query.auditLog.findMany({
        where: eq(auditLog.action, 'delete'),
        orderBy: [desc(auditLog.createdAt)],
        limit,
      });

      // Filter to only those with dependency context
      return entries.filter((entry) => entry.dependencyContext !== null);
    } catch (error) {
      console.error('Error fetching deletes with dependencies:', error);
      return [];
    }
  }

  /**
   * Compare states between two audit entries
   */
  static compareStates(entry1: any, entry2: any): any {
    const changes: any = {
      added: {},
      removed: {},
      modified: {},
    };

    const state1 = entry1.newState || {};
    const state2 = entry2.newState || {};

    // Find added and modified fields
    for (const key in state2) {
      if (!(key in state1)) {
        changes.added[key] = state2[key];
      } else if (JSON.stringify(state1[key]) !== JSON.stringify(state2[key])) {
        changes.modified[key] = {
          old: state1[key],
          new: state2[key],
        };
      }
    }

    // Find removed fields
    for (const key in state1) {
      if (!(key in state2)) {
        changes.removed[key] = state1[key];
      }
    }

    return changes;
  }

  /**
   * Get change timeline for an entity (shows what changed when)
   */
  static async getChangeTimeline(entityType: string, entityId: string): Promise<any[]> {
    try {
      const entries = await this.getEntityHistory(entityType, entityId, 100);

      const timeline = [];
      for (let i = 0; i < entries.length - 1; i++) {
        const current = entries[i];
        const previous = entries[i + 1];

        const changes = this.compareStates(previous, current);

        timeline.push({
          timestamp: current.createdAt,
          action: current.action,
          actor: current.actor,
          reason: current.reason,
          changes,
        });
      }

      return timeline;
    } catch (error) {
      console.error('Error generating change timeline:', error);
      return [];
    }
  }
}
