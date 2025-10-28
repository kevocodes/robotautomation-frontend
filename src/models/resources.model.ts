export interface Resource {
  id: string;
  externalResourceId: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SelectedResource {
  id: string;
  resourceId: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  resource: Resource;
}