import { useMemo, useState } from "react";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Resource } from "@/models/resources.model";

interface ResourceSearchableMultiSelectorProps {
  groupedResources: Record<string, Resource[]>;
  selectedResourceIds: string[];
  onChange: (resourceIds: string[]) => void;
  title?: string;
  disabled?: boolean;
}

function ResourceSearchableMultiSelector({
  groupedResources,
  selectedResourceIds,
  onChange,
  title = "Recursos",
  disabled = false,
}: ResourceSearchableMultiSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedResources = useMemo(() => {
    if (!selectedResourceIds.length) return [];

    const selectedSet = new Set(selectedResourceIds);
    const resources: Resource[] = [];

    Object.values(groupedResources).forEach((group) => {
      group.forEach((resource) => {
        if (selectedSet.has(resource.externalResourceId)) {
          resources.push(resource);
        }
      });
    });

    return resources;
  }, [groupedResources, selectedResourceIds]);

  const hasResources = Object.values(groupedResources).some(
    (resources) => resources.length > 0
  );

  const handleToggleResource = (resourceId: string) => {
    if (selectedResourceIds.includes(resourceId)) {
      onChange(selectedResourceIds.filter((id) => id !== resourceId));
      return;
    }

    onChange([...selectedResourceIds, resourceId]);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled || !hasResources) return;
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border w-fit"
          disabled={disabled || !hasResources}
        >
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedResources.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedResources.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedResources.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedResources.length} seleccionados
                  </Badge>
                ) : (
                  selectedResources.map((resource) => (
                    <Badge
                      variant="secondary"
                      key={resource.externalResourceId}
                      className="rounded-sm px-1 font-normal"
                    >
                      {resource.name}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={`Buscar ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No se encontraron recursos.</CommandEmpty>
            {Object.entries(groupedResources).map(([groupName, resources]) => (
              <CommandGroup key={groupName} heading={groupName}>
                {resources.map((resource) => {
                  const isSelected = selectedResourceIds.includes(resource.externalResourceId);
                  return (
                    <CommandItem
                      key={resource.externalResourceId}
                      value={resource.name}
                      onSelect={() => handleToggleResource(resource.externalResourceId)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <span>{resource.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            {selectedResources.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    Limpiar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ResourceSearchableMultiSelector;
