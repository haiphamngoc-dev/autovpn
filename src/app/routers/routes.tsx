import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/features/home/pages/HomePage";
import { NotFoundPage } from "@shared/components/NotFoundPage";
import { paths } from "@app/routers/paths";
import { AppShellLayout } from "@app/layouts";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShellLayout />}>
        <Route path={paths.home} element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
