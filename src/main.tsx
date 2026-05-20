import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./global.css";
import "@shared/i18n";
import {
  createTheme,
  localStorageColorSchemeManager,
  MantineProvider,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

const colorSchemeManager = localStorageColorSchemeManager({
  key: "autovpn-color-scheme",
});

const theme = createTheme({
  primaryColor: "green",
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="dark"
    >
      <Notifications />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
