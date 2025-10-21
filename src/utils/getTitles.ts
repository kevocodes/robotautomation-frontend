import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "@/constants/routes";

type Route = PUBLIC_ROUTES | PRIVATE_ROUTES;

export const getTitles = (route: Route) => {
  const titles = {
    [PUBLIC_ROUTES.LOGIN]: "Inicio de Sesión",
    [PUBLIC_ROUTES.FORGOT_PASSWORD]: "Recuperar Contraseña",
    [PUBLIC_ROUTES.RESET_PASSWORD]: "Restablecer Contraseña",
    [PRIVATE_ROUTES.HOME]: "Inicio",
    [PRIVATE_ROUTES.RESERVATIONS]: "Reservaciones",
    [PRIVATE_ROUTES.USERS]: "Usuarios",
    [PRIVATE_ROUTES.USERS_CREATE]: "Crear Usuario",
    [PRIVATE_ROUTES.USERS_EDIT]: "Editar Usuario",
    [PRIVATE_ROUTES.PROFILE]: "Perfil",
    [PRIVATE_ROUTES.VERIFY_EMAIL]: "Verificar Correo Electrónico",
  };

  return titles[route];
};
