import { FC, useMemo } from "react";

import dayjs from "dayjs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Reservation,
  ReservationCleaningEvent,
} from "@/models/reservations";

export type ReservationSelectedEventDetails = {
  type: "reservation";
  title: string;
  start: Date | null;
  end: Date | null;
  reservation: Reservation;
};

export type CleaningSelectedEventDetails = {
  type: "cleaning";
  title: string;
  start: Date | null;
  end: Date | null;
  cleaningEvent: ReservationCleaningEvent;
};

export type SelectedEventDetails =
  | ReservationSelectedEventDetails
  | CleaningSelectedEventDetails;

type CalendarEventDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: SelectedEventDetails | null;
};

const CalendarEventDetailsDialog: FC<CalendarEventDetailsDialogProps> = ({
  open,
  onOpenChange,
  event,
}) => {
  const formattedRange = useMemo(() => {
    if (!event?.start || !event?.end) return null;

    const startText = dayjs(event.start).format("DD/MM/YYYY hh:mm A");
    const endText = dayjs(event.end).format("DD/MM/YYYY hh:mm A");

    return `${startText} - ${endText}`;
  }, [event]);

  const typeLabel =
    event?.type === "cleaning" ? "Limpieza programada" : "Reservación";

  const renderContent = () => {
    if (!event) return null;

    if (event.type === "reservation") {
      return (
        <div className="grid gap-3 text-sm">
          <div>
            <span className="font-semibold">Tipo de evento</span>
            <p>{typeLabel}</p>
          </div>
          <div>
            <span className="font-semibold">Recurso</span>
            <p>{event.reservation.resourceName}</p>
          </div>
          <div>
            <span className="font-semibold">Solicitante</span>
            <p>
              {[event.reservation.firstName, event.reservation.lastName]
                .filter(Boolean)
                .join(" ") || "Sin nombre"}
            </p>
          </div>
          <div>
            <span className="font-semibold">Descripción</span>
            <p className="whitespace-pre-wrap">
              {event.reservation.description?.trim() || "Sin descripción"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-3 text-sm">
        <div>
          <span className="font-semibold">Tipo de evento</span>
          <p>{typeLabel}</p>
        </div>
        <div>
          <span className="font-semibold">Recurso</span>
          <p>{event.cleaningEvent.resourceName}</p>
        </div>
        <div>
          <span className="font-semibold">Descripción</span>
          <p className="whitespace-pre-wrap">
            {`El robot realizará la limpieza del recurso ${event.cleaningEvent.resourceName} durante este periodo.`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event?.title ?? "Evento"}</DialogTitle>
          {formattedRange ? (
            <DialogDescription>{formattedRange}</DialogDescription>
          ) : null}
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEventDetailsDialog;
