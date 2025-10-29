export interface GetReservationsResponse {
  links: unknown[];
  message: null;
  reservations: Reservation[];
  startDateTime: string;
  endDateTime: string;
}

export interface Reservation {
  message: null;
  referenceNumber: string;
  startDate: string;
  endDate: string;
  firstName: string;
  lastName: string;
  resourceName: string;
  title: string;
  description: string;
  requiresApproval: boolean;
  isRecurring: boolean;
  scheduleId: string;
  userId: string;
  resourceId: string;
  duration: string;
  bufferTime: string;
  bufferedStartDate: string;
  bufferedEndDate: string;
  color: string;
  textColor: string;
  checkInDate: string;
  checkOutDate: string;
  originalEndDate: string;
  isCheckInEnabled: boolean;
  resourceStatusId: string;
}