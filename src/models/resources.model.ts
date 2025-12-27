export interface Resource {
  id: string;
  externalResourceId: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum RoomDirection {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export interface SelectedResource {
  id: string;
  resourceId: string;
  priority: number;
  roomDirection: RoomDirection;
  createdAt: string;
  updatedAt: string;
  resource: Resource;
}