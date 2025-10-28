import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Resource } from "@/models/resources.model";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface ResourceSearchableSelectorProps {
  selectedResourceId: string;
  onSelectResource: (resourceId: string) => void;
  resources: Resource[];
  groupedResources: { [key: string]: Resource[] };
}

function ResourceSearchableSelector({ selectedResourceId, onSelectResource, resources, groupedResources }: ResourceSearchableSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[200px] justify-between"
        >
          <span className="truncate">
            {selectedResourceId
              ? resources.find((resource) => resource.id === selectedResourceId)?.name
              : "Select resource..."}
          </span>
          <ChevronsUpDown className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Busca un recurso..." className="h-9" />
          <CommandList>
            <CommandEmpty>No resource found.</CommandEmpty>
            {Object.entries(groupedResources).map(([group, resources]) => (
              <CommandGroup key={group} heading={group}>
                {resources.map((resource) => (
                  <CommandItem
                    key={resource.id}
                    value={resource.name}
                    onSelect={() => {
                      onSelectResource(
                        selectedResourceId === resource.id ? "" : resource.id
                      );
                      setOpen(false);
                    }}
                  >
                    {resource.name}
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedResourceId === resource.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ResourceSearchableSelector;
