import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomDirection, SelectedResource } from "@/models/resources.model";
import { getDirectionTitle } from "@/utils/getDirectionTitle";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

interface ChangeSelectedResourceDirectionFormProps {
  selectedResource: SelectedResource;
  onChangeDirection: (
    selectedResourceId: string,
    newDirection: RoomDirection
  ) => Promise<void> | void;
}

function ChangeSelectedResourceDirectionForm({
  selectedResource,
  onChangeDirection,
}: ChangeSelectedResourceDirectionFormProps) {
  const [selectedDirection, setSelectedDirection] = useState<RoomDirection>(
    selectedResource.roomDirection
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isChangingDirection, setIsChangingDirection] = useState(false);

  const handleDirectionChange = async (newDirection: RoomDirection) => {
    setIsChangingDirection(true);
    await onChangeDirection(selectedResource.id, newDirection);
    setIsChangingDirection(false);
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger>
        <Badge variant="outline" className="cursor-pointer">
          {getDirectionTitle(selectedResource.roomDirection)}
        </Badge>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar dirección de la ubicación del recurso</DialogTitle>
          <DialogDescription>
            Realiza cambios en la dirección del recurso aquí. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Select
            value={selectedDirection}
            onValueChange={(value) =>
              setSelectedDirection(value as RoomDirection)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RoomDirection.LEFT}>
                {getDirectionTitle(RoomDirection.LEFT)}
              </SelectItem>
              <SelectItem value={RoomDirection.RIGHT}>
                {getDirectionTitle(RoomDirection.RIGHT)}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              handleDirectionChange(selectedDirection);
            }}
            disabled={
              selectedDirection === selectedResource.roomDirection ||
              isChangingDirection
            }
          >
            {isChangingDirection && (
              <LoaderCircle size={16} className="animate-spin mr-2" />
            )}
            Cambiar dirección
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChangeSelectedResourceDirectionForm;
