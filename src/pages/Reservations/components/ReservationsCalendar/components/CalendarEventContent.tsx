import { FC } from "react";

import { EventContentArg } from "@fullcalendar/core";

import { CalendarEventExtendedProps } from "../utils/calendarEvents.types";

type CalendarEventContentProps = Pick<EventContentArg, "timeText" | "event">;

const CalendarEventContent: FC<CalendarEventContentProps> = ({
  timeText,
  event,
}) => {
  const extendedProps =
    (event.extendedProps as CalendarEventExtendedProps | undefined) ?? undefined;
  const isCleaningEvent = extendedProps?.type === "cleaning";
  const resourceName = extendedProps?.resourceName ?? "";
  const eventTitle = isCleaningEvent ? "Limpieza" : event.title;

  if (isCleaningEvent) {
    return (
      <div className="flex flex-col text-xs leading-tight">
        <span className="truncate font-semibold">{eventTitle}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-xs leading-tight">
      <span className="font-semibold">{timeText}</span>
      <span className="truncate">{eventTitle}</span>
      {resourceName ? <span className="truncate">{resourceName}</span> : null}
    </div>
  );
};

export default CalendarEventContent;
