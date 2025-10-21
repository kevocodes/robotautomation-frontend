import { translateRole } from "../utils/translateRole";
import { Role } from "@/models/user.model";

export const roles = [
  {
    value: Role.ADMIN,
    label: translateRole(Role.ADMIN),
  },
  {
    value: Role.USER,
    label: translateRole(Role.USER),
  },
];
