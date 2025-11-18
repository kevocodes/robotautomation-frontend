import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ResourceSearchableSelector from "./components/ResourceSearchableSelector";
import { SelectedResourcesSection } from "./components/SelectedResourcesSection";
import { useResourcesSelection } from "./hooks/useResourcesSelection";

const MAX_RESOURCES_SELECTION = import.meta.env
  .VITE_API_MAX_RESOURCES_SELECTION;

function ResourcesSelection() {
  const [selectedResourceId, setSelectedResourceId] = useState("");

  const {
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
    hasUnsavedOrderChanges,
    canSaveOrder,
    addSelectedResource,
    removeSelectedResource,
    reorderSelectedResourcesLocally,
    saveResourcesOrder,
    changeSelectedResourceDirection,
  } = useResourcesSelection();

  const isSelectorDisabled =
    isLoadingResources ||
    isFetchingSelectedResources ||
    isSelectionActionInFlight;
  const isAddButtonDisabled =
    !selectedResourceId ||
    isSelectorDisabled ||
    selectedResources.length >= MAX_RESOURCES_SELECTION;

  const handleAddSelectedResource = async () => {
    const wasAdded = await addSelectedResource(selectedResourceId);
    if (wasAdded) {
      setSelectedResourceId("");
    }
  };

  return (
      <div className="bg-white p-8 rounded-b-lg flex flex-col gap-4 w-full">
        <p className="text-sm font-medium">Administrar recursos</p>
        <div className="flex gap-2 flex-wrap">
          <ResourceSearchableSelector
            selectedResourceId={selectedResourceId}
            onSelectResource={setSelectedResourceId}
            resources={resources}
            groupedResources={groupedResources}
            disabled={isSelectorDisabled}
          />
          <Button
            variant="default"
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              void handleAddSelectedResource();
            }}
            disabled={isAddButtonDisabled}
          >
            {isLoadingResources ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando
                recursos...
              </span>
            ) : isAddingSelectedResource ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Agregando recurso...
              </span>
            ) : (
              "Agregar recurso"
            )}
          </Button>
        </div>

        <SelectedResourcesSection
          selectedResources={selectedResources}
          isFetchingSelectedResources={isFetchingSelectedResources}
          showSelectionOverlay={showSelectionOverlay}
          isListInteractionLocked={isListInteractionLocked}
          isRemovingSelectedResource={isRemovingSelectedResource}
          isReorderingSelectedResources={isReorderingSelectedResources}
          resourceBeingRemovedId={resourceBeingRemovedId}
          hasUnsavedOrderChanges={hasUnsavedOrderChanges}
          canSaveOrder={canSaveOrder}
          onRemove={removeSelectedResource}
          onReorder={reorderSelectedResourcesLocally}
          onSaveOrder={saveResourcesOrder}
          onChangeDirection={changeSelectedResourceDirection}
        />
      </div>
  );
}

export default ResourcesSelection;
