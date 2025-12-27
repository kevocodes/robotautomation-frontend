import { SidebarItem, SidebarItemLogout } from "./SidebarItem";
import { PRIVATE_ROUTES } from "@/constants/routes";
import { Role } from "@/models/user.model";
import { useSidebar } from "@/stores/sidebar.store";
import { Bot, CalendarClock, Cog, LogOut, User, UserCog } from "lucide-react";

interface SidebarContentProps {
  isMobile?: boolean;
}

export const SidebarContent = ({ isMobile }: SidebarContentProps) => {
  const isOpen = useSidebar((state) => state.isOpen);
  const isSidebarOpen = !isMobile ? isOpen : true;

  return (
    <>
      <SidebarItem
        label="Reservaciones"
        to={PRIVATE_ROUTES.RESERVATIONS}
        isSidebarOpen={isSidebarOpen}
        isIndexRoute
      >
        <CalendarClock size={24} />
      </SidebarItem>

      <SidebarItem
        label="Gestión de Robot"
        to={PRIVATE_ROUTES.ROBOT_DASHBOARD}
        isSidebarOpen={isSidebarOpen}
        isIndexRoute
      >
        <Bot size={24} />
      </SidebarItem>

      <SidebarItem
        label="Usuarios"
        to={PRIVATE_ROUTES.USERS}
        isSidebarOpen={isSidebarOpen}
        allowedRoles={[Role.ADMIN]}
      >
        <User size={24} />
      </SidebarItem>

      <SidebarItem
        label="Perfil"
        to={PRIVATE_ROUTES.PROFILE}
        isSidebarOpen={isSidebarOpen}
      >
        <UserCog size={24} />
      </SidebarItem>

      <SidebarItem
        label="Configuración"
        to={PRIVATE_ROUTES.SETTINGS}
        isSidebarOpen={isSidebarOpen}
        allowedRoles={[Role.ADMIN]}
      >
        <Cog size={24} />
      </SidebarItem>

      <SidebarItemLogout label="Cerrar sesión" isSidebarOpen={isSidebarOpen}>
        <LogOut size={24} />
      </SidebarItemLogout>
    </>
  );
};
