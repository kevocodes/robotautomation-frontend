import { FC, useMemo } from "react";

import dayjs from "dayjs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Reservation } from "@/models/reservations";

type SelectedEventDetails = {
  title: string;
  start: Date | null;
  end: Date | null;
  reservation: Reservation;
};

type ReservationDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: SelectedEventDetails | null;
};

const ReservationDetailsDialog: FC<ReservationDetailsDialogProps> = ({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event?.title ?? "Reserva"}</DialogTitle>
          {formattedRange ? (
            <DialogDescription>{formattedRange}</DialogDescription>
          ) : null}
        </DialogHeader>

        {event ? (
          <div className="grid gap-3 text-sm">
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export type { SelectedEventDetails };
export default ReservationDetailsDialog;
