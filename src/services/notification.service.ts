/**
 * Why: Centralizes notification creation and dispatch so UI components and services
 *      don't each manage their own notification logic or channel routing.
 * What: Provides list, markRead, markAllRead, dispatch, getUnreadCount, subscribeToEvents.
 * Test: Mock supabase.from, verify dispatch inserts a row and subscribeToEvents reacts to events.
 */

import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  userId: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const TABLE = 'notifications';

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  user_id: string;
  read: boolean;
  created_at: string;
  link: string | null;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    channel: row.channel,
    userId: row.user_id,
    read: row.read,
    createdAt: row.created_at,
    link: row.link ?? undefined,
  };
}

interface EventNotificationMapping {
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

function eventToNotification(
  event: string,
  payload: Record<string, unknown>,
): EventNotificationMapping | null {
  switch (event) {
    case 'document.processed': {
      const status = payload.status as string;
      const id = payload.id as string;
      return {
        title: status === 'completed' ? 'Document Processed' : 'Document Processing Failed',
        message:
          status === 'completed'
            ? `Document ${id} has been processed successfully.`
            : `Document ${id} processing failed. Please retry.`,
        type: status === 'completed' ? 'success' : 'error',
        link: `/documents/${id}`,
      };
    }
    case 'terms.extracted': {
      const leaseId = payload.leaseId as string;
      return {
        title: 'Terms Extracted',
        message: `Lease terms extracted for review.`,
        type: 'info',
        link: `/leases/${leaseId}`,
      };
    }
    case 'discrepancy.detected': {
      const id = payload.id as string;
      const desc = (payload.description as string) ?? 'A discrepancy was detected.';
      return {
        title: 'Discrepancy Detected',
        message: desc,
        type: 'warning',
        link: `/discrepancies/${id}`,
      };
    }
    case 'report.generated': {
      const id = payload.id as string;
      return {
        title: 'Report Generated',
        message: `Report has been generated and is ready for review.`,
        type: 'success',
        link: `/reports/${id}`,
      };
    }
    case 'export.completed': {
      const id = payload.id as string;
      return {
        title: 'Export Completed',
        message: `Your export is ready for download.`,
        type: 'success',
        link: `/exports/${id}`,
      };
    }
    case 'calendar.reminder': {
      const title = (payload.title as string) ?? 'Calendar Reminder';
      const date = (payload.date as string) ?? 'soon';
      return {
        title: 'Upcoming Event',
        message: `${title} — scheduled for ${date}`,
        type: 'warning',
        link: '/calendar',
      };
    }
    default:
      return null;
  }
}

export const notificationService = {
  /**
   * Why: Powers the notification bell dropdown and notification list page.
   * What: Fetches notifications for a user, optionally filtered to unread only.
   * Test: Mock supabase.from, assert correct filter applied and results mapped.
   */
  async list(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data as NotificationRow[]).map(toNotification);
  },

  /**
   * Why: Marks a single notification as read when the user clicks it.
   * What: Updates the read column to true for the given notification id.
   * Test: Insert an unread row, call markRead, query again, assert read is true.
   */
  async markRead(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ read: true })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Why: Lets users clear all notifications at once via "Mark all as read".
   * What: Sets read=true for all unread notifications belonging to the user.
   * Test: Insert multiple unread rows, call markAllRead, query, assert all read.
   */
  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Why: Single entry point for creating and routing notifications across channels.
   * What: Inserts a notification row (in_app only for now) and returns it.
   *       Email/push would be triggered via Supabase Edge Functions.
   * Test: Mock supabase.from, assert insert called with correct shape and result returned.
   */
  async dispatch(
    input: Omit<Notification, 'id' | 'read' | 'createdAt'>,
  ): Promise<Notification> {
    const row = {
      title: input.title,
      message: input.message,
      type: input.type,
      channel: input.channel,
      user_id: input.userId,
      link: input.link ?? null,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toNotification(data as NotificationRow);
  },

  /**
   * Why: Shows the unread badge count on the notification bell icon.
   * What: Counts rows where user_id matches and read is false.
   * Test: Insert 3 unread rows, call getUnreadCount, assert returns 3.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  },

  /**
   * Why: Bridges domain events to user-facing notifications automatically
   *      so services only emit events and don't need to know about notification logic.
   * What: Subscribes to key events on the event bus and dispatches notifications for each.
   *       Returns an unsubscribe function for cleanup.
   * Test: Call subscribeToEvents, emit a known event, assert notificationService.dispatch called.
   */
  subscribeToEvents(): () => void {
    const events = [
      'document.processed',
      'terms.extracted',
      'discrepancy.detected',
      'report.generated',
      'export.completed',
      'calendar.reminder',
    ] as const;

    const unsubscribers = events.map((event) =>
      eventBus.on(event, (payload: unknown) => {
        const mapping = eventToNotification(event, payload as Record<string, unknown>);
        if (!mapping) return;

        notificationService.dispatch({
          title: mapping.title,
          message: mapping.message,
          type: mapping.type,
          channel: 'in_app',
          userId: 'system', // Will be resolved to actual user IDs in Phase 2
          link: mapping.link,
        });
      }),
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  },
};
