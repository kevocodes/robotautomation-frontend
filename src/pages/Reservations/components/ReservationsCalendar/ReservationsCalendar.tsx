import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import esLocale from "@fullcalendar/core/locales/es";
import {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventMountArg,
} from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { toast } from "sonner";

import ResourceSearchableMultiSelector from "../ResourceSearchableMultiSelector/ResourceSearchableMultiSelector";
import CalendarEventContent from "./components/CalendarEventContent";
import CalendarEventDetailsDialog, {
  SelectedEventDetails,
} from "./components/CalendarEventDetailsDialog";
import { mapCleaningEventsToEvents } from "./utils/mapCleaningEventsToEvents";
import { mapReservationsToEvents } from "./utils/mapReservationsToEvents";
import { CalendarEventExtendedProps } from "./utils/calendarEvents.types";
import { Button } from "@/components/ui/button";
import { Reservation, ReservationCleaningEvent } from "@/models/reservations";
import { Resource, SelectedResource } from "@/models/resources.model";
import { ResponseError } from "@/models/responseError.model";
import { getReservationsByResources } from "@/services/reservations.service";
import { getSelectedResources } from "@/services/resources.service";
import { useAuth } from "@/stores/auth.store";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

type CalendarView = "timeGridWeek" | "timeGridDay";

function ReservationsCalendar() {
  const token = useAuth((state) => state.token);

  const [selectedResources, setSelectedResources] = useState<
    SelectedResource[]
  >([]);
  const [filteredResourceIds, setFilteredResourceIds] = useState<string[]>([]);
  const [isLoadingSelectedResources, setIsLoadingSelectedResources] =
    useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsCleaningEvents, setReservationsCleaningEvents] = useState<
    ReservationCleaningEvent[]
  >([]);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<SelectedEventDetails | null>(null);
  const [calendarTitle, setCalendarTitle] = useState("");
  const [currentView, setCurrentView] = useState<CalendarView>("timeGridWeek");
  const [calendarRange, setCalendarRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchSelectedResources = async () => {
      try {
        setIsLoadingSelectedResources(true);
        const response = await getSelectedResources(token);
        setSelectedResources(response);
      } catch (error) {
        if (error instanceof ResponseError) {
          toast.error(error.message);
          return;
        }

        toast.error(
          "Ha ocurrido un error inesperado al cargar los recursos seleccionados"
        );
      } finally {
        setIsLoadingSelectedResources(false);
      }
    };

    void fetchSelectedResources();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    if (!calendarRange || filteredResourceIds.length === 0) {
      setIsLoadingReservations(false);
      setReservations([]);
      setReservationsCleaningEvents([]);
      return;
    }

    const abortController = new AbortController();
    let isCurrentRequest = true;

    const loadReservations = async () => {
      try {
        setIsLoadingReservations(true);
        const response = await getReservationsByResources(
          filteredResourceIds,
          calendarRange.start,
          calendarRange.end,
          token,
          abortController.signal
        );
        if (!isCurrentRequest) return;
        setReservations(response.reservations);
        setReservationsCleaningEvents(response.cleaningEvents);
      } catch (error) {
        if (error instanceof ResponseError) {
          toast.error(error.message);
          return;
        }
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        toast.error(
          "Ha ocurrido un error inesperado al cargar las reservas de los recursos seleccionados"
        );
      } finally {
        if (isCurrentRequest) {
          setIsLoadingReservations(false);
        }
      }
    };

    void loadReservations();

    return () => {
      isCurrentRequest = false;
      abortController.abort();
    };
  }, [calendarRange, filteredResourceIds, token]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof ResizeObserver === "undefined") {
      return;
    }

    const containerElement = calendarContainerRef.current;
    if (!containerElement) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const api = calendarRef.current?.getApi();
      if (!api) return;
      api.updateSize();
    });

    observer.observe(containerElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  const selectableResourceIds = useMemo(() => {
    return Array.from(
      new Set(
        selectedResources.map(
          (selectedResource) => selectedResource.resource.externalResourceId
        )
      )
    );
  }, [selectedResources]);

  const groupedResources = useMemo(() => {
    const groups: Record<string, Resource[]> = {};

    selectedResources.forEach((selectedResource) => {
      const group = selectedResource.resource.location || "Other";
      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(selectedResource.resource);
    });

    // Order groups alphabetically
    const orderedGroups: Record<string, Resource[]> = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        orderedGroups[key] = groups[key];
      });

    // Order groups elements alphabetically
    Object.keys(orderedGroups).forEach((key) => {
      orderedGroups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return orderedGroups;
  }, [selectedResources]);

  const handleDatesSet = useCallback((payload: DatesSetArg) => {
    const nextStart = payload.start.toISOString();
    const nextEnd = payload.end.toISOString();

    setCalendarRange((previousRange) => {
      if (
        previousRange?.start === nextStart &&
        previousRange?.end === nextEnd
      ) {
        return previousRange;
      }

      return {
        start: nextStart,
        end: nextEnd,
      };
    });

    setCalendarTitle(payload.view.title);
    setCurrentView(payload.view.type as CalendarView);
  }, []);

  useEffect(() => {
    if (!selectableResourceIds.length) {
      setFilteredResourceIds([]);
      return;
    }

    setFilteredResourceIds((previousSelection) => {
      if (!previousSelection.length) {
        return selectableResourceIds;
      }

      const nextSelection = previousSelection.filter((id) =>
        selectableResourceIds.includes(id)
      );

      return nextSelection.length === previousSelection.length
        ? previousSelection
        : nextSelection;
    });
  }, [selectableResourceIds]);

  const calendarEvents = useMemo(() => {
    const mappedReservations = mapReservationsToEvents(reservations);
    const mappedCleaningEvents =
      mapCleaningEventsToEvents(reservationsCleaningEvents);

    return [...mappedReservations, ...mappedCleaningEvents];
  }, [reservations, reservationsCleaningEvents]);

  const renderEventContent = useCallback(
    (eventContent: EventContentArg) => (
      <CalendarEventContent
        timeText={eventContent.timeText}
        event={eventContent.event}
      />
    ),
    []
  );

  const handleEventDidMount = useCallback((eventMountArg: EventMountArg) => {
    const extendedProps =
      (eventMountArg.event.extendedProps as CalendarEventExtendedProps | undefined) ??
      undefined;

    if (extendedProps?.type === "cleaning") {
      eventMountArg.el.style.minHeight = "18px";
      eventMountArg.el.style.display = "flex";
      eventMountArg.el.style.alignItems = "center";
      eventMountArg.el.style.justifyContent = "center";
    }
  }, []);

  const handleEventClick = useCallback((eventClickArg: EventClickArg) => {
    const extendedProps =
      (eventClickArg.event.extendedProps as CalendarEventExtendedProps | undefined) ??
      undefined;

    if (!extendedProps) return;

    if (extendedProps.type === "reservation") {
      setSelectedEvent({
        type: "reservation",
        title: eventClickArg.event.title,
        start: eventClickArg.event.start,
        end: eventClickArg.event.end,
        reservation: extendedProps.reservation,
      });
      setIsDetailsDialogOpen(true);
      return;
    }

    if (extendedProps.type === "cleaning") {
      setSelectedEvent({
        type: "cleaning",
        title: eventClickArg.event.title,
        start: eventClickArg.event.start,
        end: eventClickArg.event.end,
        cleaningEvent: extendedProps.cleaningEvent,
      });
      setIsDetailsDialogOpen(true);
    }
  }, []);

  const handleDetailsDialogOpenChange = useCallback((open: boolean) => {
    setIsDetailsDialogOpen(open);
    if (!open) {
      setSelectedEvent(null);
    }
  }, []);

  const handlePrev = useCallback(() => {
    const api = calendarRef.current?.getApi();
    api?.prev();
  }, []);

  const handleNext = useCallback(() => {
    const api = calendarRef.current?.getApi();
    api?.next();
  }, []);

  const handleToday = useCallback(() => {
    const api = calendarRef.current?.getApi();
    api?.today();
  }, []);

  const handleViewChange = useCallback((view: CalendarView) => {
    const api = calendarRef.current?.getApi();
    if (!api || api.view.type === view) return;
    api.changeView(view);
  }, []);

  const viewOptions: Array<{ label: string; value: CalendarView }> = useMemo(
    () => [
      { label: "Semana", value: "timeGridWeek" },
      { label: "Día", value: "timeGridDay" },
    ],
    []
  );

  return (
    <div className="w-full flex flex-col gap-4">
      <ResourceSearchableMultiSelector
        title="Recursos"
        groupedResources={groupedResources}
        selectedResourceIds={filteredResourceIds}
        onChange={setFilteredResourceIds}
        disabled={
          isLoadingSelectedResources || selectableResourceIds.length === 0
        }
      />
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                aria-label="Ver semana anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                aria-label="Ver semana siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={handleToday}
                className="gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Hoy
              </Button>
            </div>
            <span className="text-lg font-semibold text-foreground">
              {calendarTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {viewOptions.map((option) => (
              <Button
                key={option.value}
                variant={currentView === option.value ? "default" : "outline"}
                onClick={() => handleViewChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div
          ref={calendarContainerRef}
          className="relative mt-4 rounded-md border border-border bg-card"
        >
          {isLoadingReservations && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-card/80 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin]}
            initialView="timeGridWeek"
            locale={esLocale}
            events={calendarEvents}
            height="auto"
            contentHeight="auto"
            slotDuration="00:10:00"
            slotLabelInterval="01:00"
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            scrollTime="06:00:00"
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }}
            slotLabelFormat={{
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            eventDidMount={handleEventDidMount}
            nowIndicator={true}
            now={new Date().toISOString()}
            headerToolbar={false}
            datesSet={handleDatesSet}
          />
        </div>
      </div>

      <CalendarEventDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={handleDetailsDialogOpenChange}
        event={selectedEvent}
      />
    </div>
  );
}

export default ReservationsCalendar;
