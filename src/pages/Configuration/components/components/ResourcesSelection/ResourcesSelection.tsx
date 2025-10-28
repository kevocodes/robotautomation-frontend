import { Accordion, AccordionTrigger } from "@/components/ui/accordion";
import { Resource, SelectedResource } from "@/models/resources.model";
import { ResponseError } from "@/models/responseError.model";
import {
  getResources,
  getSelectedResources,
  selectAvailableResource,
  unselectAvailableResource,
} from "@/services/resources.service";
import { useAuth } from "@/stores/auth.store";
import { AccordionContent, AccordionItem } from "@radix-ui/react-accordion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ResourceSearchableSelector from "./components/ResourceSearchableSelector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GripVertical, Loader2, Trash2 } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

function ResourcesSelection() {
  const [selectedResourceId, setSelectedResourceId] = useState("");

  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(false);

  const [selectedResources, setSelectedResources] = useState<
    SelectedResource[]
  >([]);
  const [isLoadingSelectedResources, setIsLoadingSelectedResources] =
    useState<boolean>(false);
  const [isMutatingSelectedResource, setIsMutatingSelectedResource] =
    useState<boolean>(false);

  const token = useAuth((state) => state.token);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoadingResources(true);
        const response = await getResources(token!);
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

    if (token) {
      fetchResources();
    }
  }, [token]);

  useEffect(() => {
    const fetchSelectedResources = async () => {
      try {
        setIsLoadingSelectedResources(true);
        const response = await getSelectedResources(token!);
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

    if (token) {
      fetchSelectedResources();
    }
  }, [token]);

  const groupedResources = useMemo(() => {
    const groups: { [key: string]: Resource[] } = {};
    resources.forEach((resource) => {
      if (selectedResources.some((sr) => sr.resourceId === resource.id)) {
        return; // Skip already selected resources
      }

      const group = resource.location || "Other";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(resource);
    });
    return groups;
  }, [resources, selectedResources]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setSelectedResources((prevSelected) => {
      const oldIndex = prevSelected.findIndex((item) => item.id === active.id);
      const newIndex = prevSelected.findIndex((item) => item.id === over.id);

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
  };

  const handleAddSelectedResource = async () => {
    if (!selectedResourceId || !token) return;

    const resourceToAdd = resources.find(
      (resource) => resource.id === selectedResourceId
    );

    if (!resourceToAdd) {
      toast.error("No se pudo encontrar el recurso seleccionado");
      return;
    }

    if (
      selectedResources.some((item) => item.resourceId === resourceToAdd.id)
    ) {
      toast.error("El recurso ya se encuentra seleccionado");
      return;
    }

    try {
      setIsMutatingSelectedResource(true);
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

      setSelectedResourceId("");
    } catch (error) {
      if (error instanceof ResponseError) {
        toast.error(error.message);
      } else {
        toast.error("Ha ocurrido un error inesperado al guardar el recurso");
      }
    } finally {
      setIsMutatingSelectedResource(false);
    }
  };

  const handleRemoveSelectedResource = async (
    selectedResource: SelectedResource
  ) => {
    if (!token) return;

    try {
      setIsMutatingSelectedResource(true);
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
      setIsMutatingSelectedResource(false);
    }
  };

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="resources-selection"
    >
      <AccordionItem value="resources-selection">
        <AccordionTrigger className="bg-white p-8 rounded-t-lg">
          Selección de Recursos
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-white px-8 pb-8 rounded-b-lg flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
              <ResourceSearchableSelector
                selectedResourceId={selectedResourceId}
                onSelectResource={setSelectedResourceId}
                resources={resources}
                groupedResources={groupedResources}
                disabled={isMutatingSelectedResource || isLoadingResources}
              />
              <Button
                variant="default"
                type="button"
                className="w-full sm:w-auto"
                onClick={handleAddSelectedResource}
                disabled={
                  !selectedResourceId ||
                  isMutatingSelectedResource ||
                  isLoadingResources
                }
              >
                {isMutatingSelectedResource ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                  </span>
                ) : isLoadingResources ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando
                    recursos...
                  </span>
                ) : (
                  "Agregar recurso"
                )}
              </Button>
            </div>

            {isLoadingResources && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                Cargando recursos disponibles...
              </div>
            )}

            <div className="mt-4 relative">
              {isMutatingSelectedResource && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/70 backdrop-blur-sm">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-500" />
                  <span className="text-sm text-slate-600">
                    Procesando selección...
                  </span>
                </div>
              )}
              {isLoadingSelectedResources ? (
                <p>Cargando recursos seleccionados...</p>
              ) : selectedResources.length === 0 ? (
                <p>No hay recursos seleccionados.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToParentElement, restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={selectedResources.map(
                      (selectedResource) => selectedResource.id
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul
                      className={cn(
                        "space-y-2",
                        isMutatingSelectedResource && "pointer-events-none"
                      )}
                    >
                      {selectedResources.map((selectedResource) => {
                        const relatedResource = selectedResource.resource;

                        return (
                          <SortableSelectedResourceItem
                            key={selectedResource.id}
                            selectedResource={selectedResource}
                            displayLabel={
                              relatedResource
                                ? `${relatedResource.name}`
                                : "Recurso no encontrado"
                            }
                            onRemove={handleRemoveSelectedResource}
                            disabled={isMutatingSelectedResource}
                          />
                        );
                      })}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default ResourcesSelection;

type SortableSelectedResourceItemProps = {
  selectedResource: SelectedResource;
  displayLabel: string;
  onRemove: (selectedResource: SelectedResource) => Promise<void> | void;
  disabled?: boolean;
};

function SortableSelectedResourceItem({
  selectedResource,
  displayLabel,
  onRemove,
  disabled = false,
}: SortableSelectedResourceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: selectedResource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityLabel = selectedResource.priority;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-2",
        isDragging && "shadow-lg bg-white"
      )}
    >
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-transparent text-slate-400 transition-colors hover:text-slate-600 focus-visible:border-slate-300 focus-visible:outline-none"
        aria-label={`Reordenar ${displayLabel}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800">{displayLabel}</p>
        <p className="text-xs text-slate-500">
          Ubicación: {selectedResource.resource?.location}
        </p>
      </div>
      <span className="text-sm font-semibold text-slate-500">
        #{priorityLabel}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          void onRemove(selectedResource);
        }}
        className="text-red-500 hover:text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2"
        disabled={disabled}
        aria-label={`Eliminar ${displayLabel}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
