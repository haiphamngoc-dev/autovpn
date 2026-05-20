import { useState } from "react";
import reactLogo from "@assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { t } = useTranslation();
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className={styles.container}>
      <h1>{t("home.title")}</h1>

      <div className={styles.row}>
        <a href="https://vite.dev" target="_blank">
          <img
            src="/vite.svg"
            className={`${styles.logo} ${styles.logoVite}`}
            alt={t("home.logos.vite")}
          />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img
            src="/tauri.svg"
            className={`${styles.logo} ${styles.logoTauri}`}
            alt={t("home.logos.tauri")}
          />
        </a>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className={`${styles.logo} ${styles.logoReact}`}
            alt={t("home.logos.react")}
          />
        </a>
      </div>
      <p>{t("home.logosHint")}</p>

      <form
        className={styles.row}
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          className={styles.greetInput}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder={t("home.namePlaceholder")}
        />
        <button type="submit">{t("home.greet")}</button>
      </form>
      <p>{greetMsg}</p>
    </div>
  );
}
