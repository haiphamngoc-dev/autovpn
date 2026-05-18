import { useState } from "react";
import reactLogo from "../assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import styles from "./App.module.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className={styles.container}>
      <h1>Welcome to Tauri + React</h1>

      <div className={styles.row}>
        <a href="https://vite.dev" target="_blank">
          <img
            src="/vite.svg"
            className={`${styles.logo} ${styles.logoVite}`}
            alt="Vite logo"
          />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img
            src="/tauri.svg"
            className={`${styles.logo} ${styles.logoTauri}`}
            alt="Tauri logo"
          />
        </a>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className={`${styles.logo} ${styles.logoReact}`}
            alt="React logo"
          />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

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
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
