import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/features/home/pages/HomePage";
import { NotFoundPage } from "@shared/components/NotFoundPage";
import { paths } from "@app/routers/paths";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.home} element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
