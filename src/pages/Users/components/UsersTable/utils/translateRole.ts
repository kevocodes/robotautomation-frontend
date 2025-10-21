import { Role } from "@/models/user.model";

export const translateRole = (role: Role) => {
  const roles = {
    [Role.ADMIN]: "Administrador",
    [Role.USER]: "Usuario",
  };

  return roles[role];
};
