import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { arrayMove } from "@dnd-kit/sortable";

import { Resource, SelectedResource } from "@/models/resources.model";
import { ResponseError } from "@/models/responseError.model";
import {
  getResources,
  getSelectedResources,
  reorderSelectedResources,
  selectAvailableResource,
  unselectAvailableResource,
} from "@/services/resources.service";
import { useAuth } from "@/stores/auth.store";

type SelectedResourcesStatus =
  | "idle"
  | "loading"
  | "adding"
  | "removing"
  | "reordering";

export function useResourcesSelection() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [selectedResources, setSelectedResources] = useState<
    SelectedResource[]
  >([]);
  const [selectedResourcesStatus, setSelectedResourcesStatus] =
    useState<SelectedResourcesStatus>("idle");
  const [resourceBeingRemovedId, setResourceBeingRemovedId] = useState<
    string | null
  >(null);

  const token = useAuth((state) => state.token);

  const isFetchingSelectedResources = selectedResourcesStatus === "loading";
  const isAddingSelectedResource = selectedResourcesStatus === "adding";
  const isRemovingSelectedResource = selectedResourcesStatus === "removing";
  const isReorderingSelectedResources = selectedResourcesStatus === "reordering";
  const isSelectionActionInFlight =
    isAddingSelectedResource ||
    isRemovingSelectedResource ||
    isReorderingSelectedResources;
  const isListInteractionLocked = isSelectionActionInFlight;
  const showSelectionOverlay = isReorderingSelectedResources;
  const canSaveOrder =
    selectedResources.length > 1 && !isSelectionActionInFlight;

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchResources = async () => {
      try {
        setIsLoadingResources(true);
        const response = await getResources(token);
        setResources(response);
      } catch (error) {
        if (error instanceof ResponseError) {
          toast.error(error.message);
          return;
        }

        toast.error("Ha ocurrido un error inesperado al cargar los recursos");
      } finally {
        setIsLoadingResources(false);
      }
    };

    void fetchResources();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchSelectedResources = async () => {
      try {
        setSelectedResourcesStatus((prevStatus) =>
          prevStatus === "idle" ? "loading" : prevStatus
        );

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
        setSelectedResourcesStatus((prevStatus) =>
          prevStatus === "loading" ? "idle" : prevStatus
        );
      }
    };

    void fetchSelectedResources();
  }, [token]);

  const groupedResources = useMemo(() => {
    const groups: Record<string, Resource[]> = {};

    resources.forEach((resource) => {
      if (selectedResources.some((sr) => sr.resourceId === resource.id)) {
        return;
      }

      const group = resource.location || "Other";
      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(resource);
    });

    return groups;
  }, [resources, selectedResources]);

  const addSelectedResource = useCallback(
    async (resourceId: string) => {
      if (!token || !resourceId) {
        return false;
      }

      const resourceToAdd = resources.find(
        (resource) => resource.id === resourceId
      );

      if (!resourceToAdd) {
        toast.error("No se pudo encontrar el recurso seleccionado");
        return false;
      }

      if (
        selectedResources.some((item) => item.resourceId === resourceToAdd.id)
      ) {
        toast.error("El recurso ya se encuentra seleccionado");
        return false;
      }

      try {
        setSelectedResourcesStatus("adding");

        const savedSelectedResource = await selectAvailableResource(
          resourceToAdd.id,
          token
        );

        setSelectedResources((prevSelected) => {
          const updated = [
            ...prevSelected,
            {
              ...savedSelectedResource,
              resource: savedSelectedResource.resource ?? resourceToAdd,
            },
          ];

          return updated
            .sort((a, b) => a.priority - b.priority)
            .map((item, index) => ({
              ...item,
              priority: index + 1,
            }));
        });

        return true;
      } catch (error) {
        if (error instanceof ResponseError) {
          toast.error(error.message);
        } else {
          toast.error("Ha ocurrido un error inesperado al guardar el recurso");
        }
        return false;
      } finally {
        setSelectedResourcesStatus((prevStatus) =>
          prevStatus === "adding" ? "idle" : prevStatus
        );
      }
    },
    [resources, selectedResources, token]
  );

  const removeSelectedResource = useCallback(
    async (selectedResource: SelectedResource) => {
      if (!token) {
        return;
      }

      try {
        setSelectedResourcesStatus("removing");
        setResourceBeingRemovedId(selectedResource.id);
        await unselectAvailableResource(selectedResource.id, token);

        setSelectedResources((prevSelected) =>
          prevSelected
            .filter((item) => item.id !== selectedResource.id)
            .map((item, index) => ({
              ...item,
              priority: index + 1,
            }))
        );
      } catch (error) {
        if (error instanceof ResponseError) {
          toast.error(error.message);
        } else {
          toast.error("Ha ocurrido un error inesperado al eliminar el recurso");
        }
      } finally {
        setResourceBeingRemovedId(null);
        setSelectedResourcesStatus((prevStatus) =>
          prevStatus === "removing" ? "idle" : prevStatus
        );
      }
    },
    [token]
  );

  const reorderSelectedResourcesLocally = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) {
        return;
      }

      setSelectedResources((prevSelected) => {
        const oldIndex = prevSelected.findIndex((item) => item.id === activeId);
        const newIndex = prevSelected.findIndex((item) => item.id === overId);

        if (oldIndex === -1 || newIndex === -1) {
          return prevSelected;
        }

        const reordered = arrayMove(prevSelected, oldIndex, newIndex).map(
          (item, index) => ({
            ...item,
            priority: index + 1,
          })
        );

        return reordered;
      });
    },
    []
  );

  const saveResourcesOrder = useCallback(async () => {
    if (!token || selectedResources.length === 0) {
      return;
    }

    try {
      setSelectedResourcesStatus("reordering");

      const orderedIds = selectedResources.map(
        (selectedResource) => selectedResource.id
      );

      await reorderSelectedResources(orderedIds, token);
      toast.success("Orden de recursos actualizado correctamente");
    } catch (error) {
      if (error instanceof ResponseError) {
        toast.error(error.message);
      } else {
        toast.error("Ha ocurrido un error inesperado al guardar el orden");
      }
    } finally {
      setSelectedResourcesStatus((prevStatus) =>
        prevStatus === "reordering" ? "idle" : prevStatus
      );
    }
  }, [selectedResources, token]);

  return {
    resources,
    groupedResources,
    selectedResources,
    resourceBeingRemovedId,
    isLoadingResources,
    isFetchingSelectedResources,
    isAddingSelectedResource,
    isRemovingSelectedResource,
    isReorderingSelectedResources,
    isSelectionActionInFlight,
    isListInteractionLocked,
    showSelectionOverlay,
    canSaveOrder,
    addSelectedResource,
    removeSelectedResource,
    reorderSelectedResourcesLocally,
    saveResourcesOrder,
  };
}
