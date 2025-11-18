import { useState } from "react";
import { Accordion, AccordionTrigger } from "@/components/ui/accordion";
import { AccordionContent, AccordionItem } from "@radix-ui/react-accordion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import ResourceSearchableSelector from "./components/ResourceSearchableSelector";
import { SelectedResourcesSection } from "./components/SelectedResourcesSection";
import { useResourcesSelection } from "./hooks/useResourcesSelection";

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
  } = useResourcesSelection();

  const isSelectorDisabled =
    isLoadingResources ||
    isFetchingSelectedResources ||
    isSelectionActionInFlight;
  const isAddButtonDisabled = !selectedResourceId || isSelectorDisabled;

  const handleAddSelectedResource = async () => {
    const wasAdded = await addSelectedResource(selectedResourceId);
    if (wasAdded) {
      setSelectedResourceId("");
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
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default ResourcesSelection;
