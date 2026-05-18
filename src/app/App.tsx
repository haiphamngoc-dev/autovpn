import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routers/routes";

export default function App() {
  return (
    <MemoryRouter>
      <AppRoutes />
    </MemoryRouter>
  );
}
