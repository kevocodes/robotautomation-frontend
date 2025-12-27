import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoomDirection, SelectedResource } from "@/models/resources.model";
import { useSortable } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import ChangeSelectedResourceDirectionForm from "./components/ChangeSelectedResourceDirectionForm";

type SelectedResourcesListItemProps = {
  selectedResource: SelectedResource;
  displayLabel: string;
  disabled?: boolean;
  isBeingRemoved?: boolean;
  isThePriorityOne?: boolean;
  onRemove: (selectedResource: SelectedResource) => Promise<void> | void;
  onChangeDirection: (selectedResourceId: string, newDirection: RoomDirection) => Promise<void> | void;
};

export function SelectedResourcesListItem({
  selectedResource,
  displayLabel,
  disabled = false,
  isBeingRemoved = false,
  isThePriorityOne = false,
  onRemove,
  onChangeDirection,
}: SelectedResourcesListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: selectedResource.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-2",
        isDragging && "shadow-lg bg-white",
        isBeingRemoved && "opacity-70"
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
      <div className="flex flex-col sm:flex-row justify-between w-full">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">{displayLabel}</p>
          <p className="text-xs text-slate-500">
            Ubicación: {selectedResource.resource?.location}
          </p>
        </div>
        <div className="flex flex-1 sm:flex-none items-center gap-1">
          {isThePriorityOne && <Badge variant="default">Prioritario</Badge>}
          <ChangeSelectedResourceDirectionForm selectedResource={selectedResource} onChangeDirection={onChangeDirection} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (!isBeingRemoved) {
                void onRemove(selectedResource);
              }
            }}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2"
            disabled={disabled || isBeingRemoved}
            aria-label={`Eliminar ${displayLabel}`}
          >
            {isBeingRemoved ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </li>
  );
}
