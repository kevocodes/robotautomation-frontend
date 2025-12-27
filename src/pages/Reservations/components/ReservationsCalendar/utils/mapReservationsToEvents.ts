import { EventInput } from "@fullcalendar/core";

import { Reservation } from "@/models/reservations";
import { ReservationEventExtendedProps } from "./calendarEvents.types";

const buildReservationTitle = (reservation: Reservation): string => {
  const name = [reservation.firstName, reservation.lastName]
    .filter(Boolean)
    .join(" ");

  if (reservation.title?.trim()) return reservation.title;
  if (name.trim()) return name.trim();
  if (reservation.resourceName?.trim()) return reservation.resourceName.trim();

  return "Reserva sin título";
};

const buildReservationEventId = (reservation: Reservation, index: number) => {
  if (reservation.referenceNumber?.trim()) {
    return `${reservation.referenceNumber}-${reservation.resourceId}`;
  }

  return `reservation-${reservation.resourceId}-${reservation.startDate}-${reservation.endDate}-${index}`;
};

export const mapReservationsToEvents = (
  reservations: Reservation[]
): EventInput[] => {
  return reservations.map((reservation, index) => ({
    id: buildReservationEventId(reservation, index),
    title: buildReservationTitle(reservation),
    start: reservation.startDate,
    end: reservation.endDate,
    backgroundColor: reservation.color || undefined,
    textColor: reservation.textColor || undefined,
    extendedProps: {
      type: "reservation",
      reservation,
      description: reservation.description,
      resourceName: reservation.resourceName,
      requiresApproval: reservation.requiresApproval,
    } satisfies ReservationEventExtendedProps,
  }));
};
