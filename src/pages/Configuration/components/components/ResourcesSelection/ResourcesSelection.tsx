import { Accordion, AccordionTrigger } from "@/components/ui/accordion";
import { Resource, SelectedResource } from "@/models/resources.model";
import { ResponseError } from "@/models/responseError.model";
import {
  getResources,
  getSelectedResources,
} from "@/services/resources.service";
import { useAuth } from "@/stores/auth.store";
import { AccordionContent, AccordionItem } from "@radix-ui/react-accordion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ResourceSearchableSelector from "./components/ResourceSearchableSelector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2 } from "lucide-react";
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
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";

function ResourcesSelection() {
  const [selectedResourceId, setSelectedResourceId] = useState("");

  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(false);

  const [selectedResources, setSelectedResources] = useState<
    SelectedResource[]
  >([]);
  const [isLoadingSelectedResources, setIsLoadingSelectedResources] =
    useState<boolean>(false);

  const token = useAuth((state) => state.token);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoadingResources(true);
        const response = await getResources(token!);
        setResources(response);
      } catch (error) {
        if (error instanceof ResponseError) return toast.error(error.message);
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
        if (error instanceof ResponseError) return toast.error(error.message);
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

  const handleRemoveSelectedResource = (selectedResourceId: string) => {
    setSelectedResources((prevSelected) =>
      prevSelected
        .filter((item) => item.id !== selectedResourceId)
        .map((item, index) => ({
          ...item,
          priority: index + 1,
        }))
    );
  };

  const generateTemporaryId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const handleAddSelectedResource = () => {
    if (!selectedResourceId) return;

    const resourceToAdd = resources.find(
      (resource) => resource.id === selectedResourceId
    );

    if (!resourceToAdd) {
      toast.error("No se pudo encontrar el recurso seleccionado");
      return;
    }

    setSelectedResources((prevSelected) => {
      if (prevSelected.some((item) => item.resourceId === resourceToAdd.id)) {
        return prevSelected;
      }

      const now = new Date().toISOString();

      const newSelectedResource: SelectedResource = {
        id: generateTemporaryId(),
        resourceId: resourceToAdd.id,
        priority: prevSelected.length + 1,
        createdAt: now,
        updatedAt: now,
        resource: resourceToAdd,
      };

      return [...prevSelected, newSelectedResource];
    });

    setSelectedResourceId("");
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
              />
              <Button
                variant="default"
                type="button"
                className="w-full sm:w-auto"
                onClick={handleAddSelectedResource}
                disabled={!selectedResourceId}
              >
                Agregar recurso
              </Button>
            </div>

            <div className="mt-4">
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
                    <ul className="space-y-2">
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
  onRemove: (selectedResourceId: string) => void;
};

function SortableSelectedResourceItem({
  selectedResource,
  displayLabel,
  onRemove,
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
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800">{displayLabel}</p>
        <p className="text-xs text-slate-500">Ubicación: {selectedResource.resource?.location}</p>
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
          onRemove(selectedResource.id);
        }}
        className="text-red-500 hover:text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2"
        aria-label={`Eliminar ${displayLabel}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
