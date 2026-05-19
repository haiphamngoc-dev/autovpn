import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/features/home/pages/HomePage";
import { paths } from "@app/routers/paths";
import { AppShellLayout, MainLayout } from "@app/layouts";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShellLayout />}>
        <Route element={<MainLayout />}>
          <Route path={paths.home} element={<HomePage />} />
          <Route path="*" element={<Navigate to={paths.home} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
