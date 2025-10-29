import { GetReservationsResponse, Reservation, ReservationCleaningEvent } from "@/models/reservations";
import { ResponseError } from "@/models/responseError.model";

const BASE_URL = import.meta.env.VITE_API_URL;

export const getReservationsByResources = async (
  resourceIds: string[],
  startDateTime: string,
  endDateTime: string,
  token: string,
  signal?: AbortSignal
): Promise<{ reservations: Reservation[]; cleaningEvents: ReservationCleaningEvent[] }> => {
  const queryParams = new URLSearchParams();
  resourceIds.forEach((id) => queryParams.append("resourceIds", id));
  queryParams.append("startDateTime", startDateTime);
  queryParams.append("endDateTime", endDateTime);

  const response = await fetch(
    `${BASE_URL}/reservations/by-resources?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    }
  );
  if (!response.ok)
    throw new ResponseError("Failed to fetch reservations", response.status);

  const { data } = await response.json();

  const { reservations, cleaningEvents }: GetReservationsResponse = data;

  return { reservations, cleaningEvents };
};
