import { google } from "googleapis";

import { getServerSession, getGoogleAccessToken } from "./auth-supabase";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  hangoutLink?: string;
}

export interface BusyTime {
  start: string;
  end: string;
}

export class GoogleCalendarService {
  private calendar: any;

  constructor(private accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  /**
   * Get busy times for a user within a date range
   */
  async getFreeBusyInfo(
    timeMin: string,
    timeMax: string,
    emails: string[]
  ): Promise<Record<string, BusyTime[]>> {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: emails.map((email) => ({ id: email })),
        },
      });

      const busyTimes: Record<string, BusyTime[]> = {};

      for (const email of emails) {
        const calendar = response.data.calendars?.[email];
        busyTimes[email] =
          calendar?.busy?.map((period: any) => ({
            start: period.start,
            end: period.end,
          })) || [];
      }

      return busyTimes;
    } catch (error) {
      console.error("Error fetching free/busy info:", error);
      throw new Error("Failed to fetch calendar availability");
    }
  }

  /**
   * List events for current user with attendees within a date range
   */
  async listUserEventsWithAttendees(
    timeMin: string,
    timeMax: string
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
      });

      const events = (response.data.items || []).map((e: any) => ({
        id: e.id,
        summary: e.summary,
        description: e.description,
        start: { dateTime: e.start?.dateTime || e.start?.date },
        end: { dateTime: e.end?.dateTime || e.end?.date },
        attendees: (e.attendees || []).map((a: any) => ({ email: a.email, responseStatus: a.responseStatus })),
        hangoutLink: e.hangoutLink,
      })) as CalendarEvent[];

      return events;
    } catch (error) {
      console.error("Error listing events with attendees:", error);
      throw error;
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          ...event,
          conferenceData: {
            createRequest: {
              requestId: Math.random().toString(36).substring(2, 15),
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          },
        },
        conferenceDataVersion: 1,
        sendNotifications: true,
      });

      return response.data;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw new Error("Failed to create calendar event");
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const response = await this.calendar.events.update({
        calendarId: "primary",
        eventId,
        requestBody: event,
        sendNotifications: true,
      });

      return response.data;
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw new Error("Failed to update calendar event");
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId,
        sendNotifications: true,
      });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      throw new Error("Failed to delete calendar event");
    }
  }
}

/**
 * Get Google Calendar service for the current user
 */
export async function getCalendarService(): Promise<GoogleCalendarService | null> {
  const accessToken = await getGoogleAccessToken();

  if (!accessToken) {
    return null;
  }

  return new GoogleCalendarService(accessToken);
}

// Create a service from a provided access token (bypasses session helpers)
export function getCalendarServiceWithToken(accessToken: string): GoogleCalendarService {
  return new GoogleCalendarService(accessToken);
}

/**
 * Find available time slots for multiple users
 */
export async function findAvailableSlots({
  emails,
  duration = 30,
  daysToCheck = 7,
  businessHours = { start: 9, end: 17 },
}: {
  emails: string[];
  duration?: number;
  daysToCheck?: number;
  businessHours?: { start: number; end: number };
}): Promise<Array<{ start: string; end: string }>> {
  const calendarService = await getCalendarService();

  if (!calendarService) {
    throw new Error("No calendar access - please sign in");
  }

  // Calculate date range
  const now = new Date();
  const endDate = new Date(now.getTime() + daysToCheck * 24 * 60 * 60 * 1000);

  // Get busy times for all users
  const busyTimes = await calendarService.getFreeBusyInfo(now.toISOString(), endDate.toISOString(), emails);

  // Find free slots
  const slots: Array<{ start: string; end: string }> = [];
  const slotDurationMs = duration * 60 * 1000;

  for (let d = 0; d < daysToCheck; d++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + d);

    // Skip weekends
    if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      continue;
    }

    // Check business hours
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(checkDate);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

        // Don't check slots in the past
        if (slotStart < now) {
          continue;
        }

        // Don't check slots that extend beyond business hours
        if (slotEnd.getHours() >= businessHours.end) {
          break;
        }

        // Check if this slot is free for ALL users
        let isAvailable = true;

        for (const email of emails) {
          const userBusyTimes = busyTimes[email] || [];

          for (const busy of userBusyTimes) {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);

            // Check for overlap
            if (
              (slotStart >= busyStart && slotStart < busyEnd) ||
              (slotEnd > busyStart && slotEnd <= busyEnd) ||
              (slotStart <= busyStart && slotEnd >= busyEnd)
            ) {
              isAvailable = false;
              break;
            }
          }

          if (!isAvailable) break;
        }

        if (isAvailable) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          });

          // Limit to 10 slots to keep response manageable
          if (slots.length >= 10) {
            return slots;
          }
        }
      }
    }
  }

  return slots;
}

// Same as findAvailableSlots but reuses a provided service
export async function findAvailableSlotsWithService({
  calendarService,
  emails,
  duration = 30,
  daysToCheck = 7,
  businessHours = { start: 9, end: 17 },
}: {
  calendarService: GoogleCalendarService;
  emails: string[];
  duration?: number;
  daysToCheck?: number;
  businessHours?: { start: number; end: number };
}): Promise<Array<{ start: string; end: string }>> {
  // Calculate date range
  const now = new Date();
  const endDate = new Date(now.getTime() + daysToCheck * 24 * 60 * 60 * 1000);

  // Get busy times for all users
  const busyTimes = await calendarService.getFreeBusyInfo(now.toISOString(), endDate.toISOString(), emails);

  // Find free slots
  const slots: Array<{ start: string; end: string }> = [];
  const slotDurationMs = duration * 60 * 1000;

  for (let d = 0; d < daysToCheck; d++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + d);

    if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      continue;
    }

    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(checkDate);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

        if (slotStart < now) continue;
        if (slotEnd.getHours() >= businessHours.end) break;

        let isAvailable = true;
        for (const email of emails) {
          const userBusyTimes = busyTimes[email] || [];
          for (const busy of userBusyTimes) {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            if (
              (slotStart >= busyStart && slotStart < busyEnd) ||
              (slotEnd > busyStart && slotEnd <= busyEnd) ||
              (slotStart <= busyStart && slotEnd >= busyEnd)
            ) {
              isAvailable = false;
              break;
            }
          }
          if (!isAvailable) break;
        }

        if (isAvailable) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
          if (slots.length >= 10) return slots;
        }
      }
    }
  }

  return slots;
}
