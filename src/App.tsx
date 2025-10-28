import { Toaster } from "@/components/ui/sonner";
import {
  DEFAULT_REDIRECT,
  PRIVATE_ROUTES,
  PUBLIC_ROUTES,
} from "@/constants/routes";
import RequireAuth from "@/guards/privateRoute.guard";
import NoRequireAuth from "@/guards/publicRoute.guard";
import AppLayout from "@/layouts/AppLayout";
import { Role } from "@/models/user.model";
import Login from "@/pages/Login/Login";
import { validateSession } from "@/services/auth.service";
import { useAuth } from "@/stores/auth.store";
import { createAppUserFromResponseUser } from "@/utils/createAppUserFromResponseUser.util";
import { useEffect } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Users from "@/pages/Users/Users";
import UserCreate from "@/pages/UsersCreate/UserCreate";
import UserEdit from "@/pages/UserEdit/UserEdit";
import Profile from "@/pages/Profile/Profile";
import VerfiyEmail from "@/pages/VerifyEmail/VerifyEmail";
import RequireUnverifiedUser from "@/guards/unverifiedUser.guard";
import ForgotPasword from "@/pages/ForgotPassword/ForgotPasword";
import ResetPassword from "@/pages/ResetPassword/ResetPassword";
import Reservations from "@/pages/Reservations/Reservations";
import Configuration from "./pages/Configuration/Configuration";

function App() {
  const token = useAuth((state) => state.token);
  const setUser = useAuth((state) => state.setUser);
  const logout = useAuth((state) => state.logout);

  useEffect(() => {
    const validateUser = async (token: string) => {
      try {
        const userInfo = await validateSession(token);
        setUser(createAppUserFromResponseUser(userInfo));
      } catch (error) {
        logout();
      }
    };

    // Validate user session if token exists
    if (token) validateUser(token);
  }, [token, setUser, logout]);

  return (
    <>
      <Router>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route element={<NoRequireAuth />}>
            <Route path={PUBLIC_ROUTES.LOGIN} element={<Login />} />
            <Route
              path={PUBLIC_ROUTES.FORGOT_PASSWORD}
              element={<ForgotPasword />}
            />
            <Route
              path={`${PUBLIC_ROUTES.RESET_PASSWORD}/:token`}
              element={<ResetPassword />}
            />
          </Route>

          {/* PRIVATE ROUTES */}
          <Route element={<AppLayout />}>
            <Route
              element={
                <RequireAuth
                  allowedRoles={[Role.ADMIN, Role.USER]}
                />
              }
            >
              <Route index element={<Reservations />} />
              <Route path={PRIVATE_ROUTES.RESERVATIONS} element={<Reservations />} />

              <Route path={PRIVATE_ROUTES.PROFILE} element={<Profile />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={[Role.ADMIN]} />}>
              <Route path={PRIVATE_ROUTES.USERS} element={<Users />} />
              <Route
                path={PRIVATE_ROUTES.USERS_CREATE}
                element={<UserCreate />}
              />
              <Route
                path={`${PRIVATE_ROUTES.USERS_EDIT}/:userId`}
                element={<UserEdit />}
              />
              <Route path={PRIVATE_ROUTES.SETTINGS} element={<Configuration />} />
            </Route>
          </Route>

          {/* VERIFICATIONS */}
          <Route element={<RequireUnverifiedUser />}>
            <Route
              path={PRIVATE_ROUTES.VERIFY_EMAIL}
              element={<VerfiyEmail />}
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to={DEFAULT_REDIRECT} />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
