import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/features/home/pages/HomePage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { paths } from "@app/routers/paths";
import { AppLayout, MainLayout } from "@app/layouts";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route element={<MainLayout />}>
          <Route path={paths.home} element={<HomePage />} />
          <Route path={paths.settings} element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={paths.home} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
