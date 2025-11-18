import { Resource, RoomDirection, SelectedResource } from "@/models/resources.model";
import { ResponseError } from "@/models/responseError.model";

const BASE_URL = import.meta.env.VITE_API_URL;

export const getResources = async (token: string): Promise<Resource[]> => {
  const response = await fetch(`${BASE_URL}/resources`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok)
    throw new ResponseError("Failed to fetch resources", response.status);

  const { data } = await response.json();

  return data;
};

export const getSelectedResources = async (
  token: string
): Promise<SelectedResource[]> => {
  const response = await fetch(`${BASE_URL}/resources/selected`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok)
    throw new ResponseError(
      "Failed to fetch selected resources",
      response.status
    );

  const { data } = await response.json();

  return data;
};

export const selectAvailableResource = async (
  resourceId: string,
  token: string
): Promise<SelectedResource> => {
  const response = await fetch(`${BASE_URL}/resources/${resourceId}/select`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new ResponseError("Resource not found", response.status);
    }

    if (response.status === 400) {
      const { message } = await response.json();
      throw new ResponseError(message, response.status);
    }

    throw new ResponseError("Failed to select resource", response.status);
  }

  const { data } = await response.json();

  return data;
};

export const unselectAvailableResource = async (
  resourceId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${BASE_URL}/resources/${resourceId}/deselect`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new ResponseError("Resource not found", response.status);
    }

    throw new ResponseError("Failed to unselect resource", response.status);
  }
};

export const reorderSelectedResources = async (
  orderedIds: string[],
  token: string
): Promise<void> => {
  const response = await fetch(`${BASE_URL}/resources/adjust-priorities`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderedIds,
    }),
  });

  if (!response.ok) {
    throw new ResponseError(
      "Failed to reorder selected resources",
      response.status
    );
  }
};

export const changeSelectedResourceDirection = async (
  resourceId: string,
  newDirection: RoomDirection,
  token: string
): Promise<SelectedResource> => {
  const response = await fetch(
    `${BASE_URL}/resources/${resourceId}/change-room-direction`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomDirection: newDirection,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new ResponseError("Resource not found", response.status);
    }

    throw new ResponseError(
      "Failed to change resource direction",
      response.status
    );
  }

  const { data } = await response.json();

  return data;
}