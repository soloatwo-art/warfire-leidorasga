import { UserRole, UserStatus } from "@warfire/shared";

export interface AuthenticatedUser {
  id: string;
  login: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}
