import { RoomDirection } from "@/models/resources.model";

export function getDirectionTitle(direction: RoomDirection) {
  switch (direction) {
    case RoomDirection.LEFT:
      return "Izquierda";
    case RoomDirection.RIGHT:
      return "Derecha";
    default:
      return "Desconocida";
  }
}