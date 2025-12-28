import { EventInput } from "@fullcalendar/core";

import { ReservationCleaningEvent } from "@/models/reservations";
import { CleaningEventExtendedProps } from "./calendarEvents.types";

const buildCleaningEventId = (cleaningEvent: ReservationCleaningEvent, index: number) => {
  return `cleaning-${cleaningEvent.resourceName}-${cleaningEvent.startDate}-${cleaningEvent.endDate}-${index}`;
};

export const mapCleaningEventsToEvents = (
  cleaningEvents: ReservationCleaningEvent[]
): EventInput[] => {
  return cleaningEvents.map((cleaningEvent, index) => ({
    id: buildCleaningEventId(cleaningEvent, index),
    title: "Desinfección",
    start: cleaningEvent.startDate,
    end: cleaningEvent.endDate,
    backgroundColor: cleaningEvent.color || undefined,
    textColor: cleaningEvent.textColor || undefined,
    extendedProps: {
      type: "cleaning",
      cleaningEvent,
      resourceName: cleaningEvent.resourceName,
      description: `Desinfección programada del recurso ${cleaningEvent.resourceName}`,
    } satisfies CleaningEventExtendedProps,
  }));
};
