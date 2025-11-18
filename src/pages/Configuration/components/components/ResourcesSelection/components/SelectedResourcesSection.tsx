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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { Loader2, PackageOpen } from "lucide-react";

import { SelectedResource } from "@/models/resources.model";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { SelectedResourcesListItem } from "./SelectedResourcesListItem";

type SelectedResourcesSectionProps = {
  selectedResources: SelectedResource[];
  isFetchingSelectedResources: boolean;
  showSelectionOverlay: boolean;
  isListInteractionLocked: boolean;
  isRemovingSelectedResource: boolean;
  isReorderingSelectedResources: boolean;
  resourceBeingRemovedId: string | null;
  hasUnsavedOrderChanges: boolean;
  canSaveOrder: boolean;
  onRemove: (selectedResource: SelectedResource) => Promise<void> | void;
  onReorder: (activeId: string, overId: string) => void;
  onSaveOrder: () => Promise<void> | void;
};

export function SelectedResourcesSection({
  selectedResources,
  isFetchingSelectedResources,
  showSelectionOverlay,
  isListInteractionLocked,
  isRemovingSelectedResource,
  isReorderingSelectedResources,
  resourceBeingRemovedId,
  hasUnsavedOrderChanges,
  canSaveOrder,
  onRemove,
  onReorder,
  onSaveOrder,
}: SelectedResourcesSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || isListInteractionLocked) {
      return;
    }

    onReorder(String(active.id), String(over.id));
  };

  return (
    <div className="mt-4 relative">
      {showSelectionOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/70 backdrop-blur-sm">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-500" />
          <span className="text-sm text-slate-600">Guardando orden...</span>
        </div>
      )}

      {isFetchingSelectedResources ? (
        <SkeletonList />
      ) : selectedResources.length === 0 ? (
        <EmptyState />
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
                isListInteractionLocked && "pointer-events-none opacity-80"
              )}
            >
              {selectedResources.map((selectedResource) => {
                const relatedResource = selectedResource.resource;
                const displayLabel = relatedResource
                  ? `${relatedResource.name}`
                  : "Recurso no encontrado";
                const isBeingRemoved =
                  resourceBeingRemovedId === selectedResource.id &&
                  isRemovingSelectedResource;

                return (
                  <SelectedResourcesListItem
                    key={selectedResource.id}
                    selectedResource={selectedResource}
                    displayLabel={displayLabel}
                    onRemove={onRemove}
                    disabled={isListInteractionLocked}
                    isBeingRemoved={isBeingRemoved}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {hasUnsavedOrderChanges && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="default"
            className="w-full"
            onClick={() => {
              void onSaveOrder();
            }}
            disabled={!canSaveOrder}
          >
            {isReorderingSelectedResources ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando orden...
              </span>
            ) : (
              "Guardar orden"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((item) => (
        <Skeleton
          key={item}
          className="rounded-md border h-[3.375rem]"
        >
        </Skeleton>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
      <PackageOpen className="h-10 w-10 text-slate-300" />
      <p className="text-sm font-medium text-slate-700">
        Aún no has seleccionado recursos
      </p>
      <p className="text-xs text-slate-500">
        Usa el buscador de arriba para agregar los recursos que necesitas.
      </p>
    </div>
  );
}
