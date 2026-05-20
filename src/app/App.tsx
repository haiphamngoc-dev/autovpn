import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routers/routes";
import { I18nLanguageSync } from "@shared/i18n/I18nLanguageSync";

export default function App() {
  return (
    <MemoryRouter>
      <I18nLanguageSync />
      <AppRoutes />
    </MemoryRouter>
  );
}
