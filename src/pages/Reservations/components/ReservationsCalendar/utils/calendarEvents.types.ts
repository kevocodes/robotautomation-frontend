import { Reservation, ReservationCleaningEvent } from "@/models/reservations";

export type ReservationEventExtendedProps = {
  type: "reservation";
  reservation: Reservation;
  resourceName: string;
  description: string;
  requiresApproval: boolean;
};

export type CleaningEventExtendedProps = {
  type: "cleaning";
  cleaningEvent: ReservationCleaningEvent;
  resourceName: string;
  description: string;
};

export type CalendarEventExtendedProps =
  | ReservationEventExtendedProps
  | CleaningEventExtendedProps;
