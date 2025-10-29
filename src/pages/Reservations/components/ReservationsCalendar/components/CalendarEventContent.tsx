import { FC } from "react";

import { EventContentArg } from "@fullcalendar/core";

type CalendarEventContentProps = Pick<EventContentArg, "timeText" | "event">;

const CalendarEventContent: FC<CalendarEventContentProps> = ({
  timeText,
  event,
}) => {
  const resourceName = (event.extendedProps?.resourceName as string) ?? "";

  return (
    <div className="flex flex-col text-xs leading-tight">
      <span className="font-semibold">{timeText}</span>
      <span className="truncate">{event.title}</span>
      {resourceName ? (
        <span className="truncate">{resourceName}</span>
      ) : null}
    </div>
  );
};

export default CalendarEventContent;
