export enum PUBLIC_ROUTES {
  LOGIN = "/inicio-sesion",
  FORGOT_PASSWORD = "/recuperar-contrasena",
  RESET_PASSWORD = "/restablecer-contrasena",
}

export enum PRIVATE_ROUTES {
  HOME = "/",

  RESERVATIONS = "/reservaciones",

  USERS = "/usuarios",
  USERS_CREATE = "/usuarios/crear",
  USERS_EDIT = "/usuarios/editar",

  VERIFY_EMAIL = "/verificar-correo",
  PROFILE = "/perfil",
}

export const DEFAULT_REDIRECT = PRIVATE_ROUTES.HOME;
