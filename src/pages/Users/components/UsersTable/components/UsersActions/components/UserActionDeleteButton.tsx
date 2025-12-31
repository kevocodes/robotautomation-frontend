import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface UserActionDeleteButtonProps {
  onOpen: () => void;
}

function UserActionDeleteButton({ onOpen }: UserActionDeleteButtonProps) {
  return (
    <DropdownMenuItem
      onSelect={onOpen}
      className="focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
    >
      Eliminar
    </DropdownMenuItem>
  );
}

export default UserActionDeleteButton;
