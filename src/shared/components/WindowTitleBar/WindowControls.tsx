import { Group, UnstyledButton } from "@mantine/core";
import { useWindowControls } from "@shared/hooks";
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from "./icons";
import styles from "./WindowControls.module.css";

export function WindowControls() {
  const { maximized, minimize, toggleMaximize, close } = useWindowControls();
  const isMac =
    typeof window !== "undefined" && navigator.userAgent.includes("Mac");

  if (isMac) {
    return (
      <div className={styles.macOSControls} data-no-drag>
        <button
          type="button"
          onClick={close}
          className={`${styles.macOSButton} ${styles.macOSClose}`}
          aria-label="Close"
        />
        <button
          type="button"
          onClick={minimize}
          className={`${styles.macOSButton} ${styles.macOSMinimize}`}
          aria-label="Minimize"
        />
        <button
          type="button"
          onClick={toggleMaximize}
          className={`${styles.macOSButton} ${styles.macOSMaximize}`}
          aria-label="Maximize"
        />
      </div>
    );
  }

  return (
    <Group gap={0} wrap="nowrap" className={styles.windowButtons} data-no-drag>
      <UnstyledButton
        className={styles.button}
        onClick={minimize}
        title="Minimize"
        aria-label="Minimize"
      >
        <MinimizeIcon />
      </UnstyledButton>
      <UnstyledButton
        className={styles.button}
        onClick={toggleMaximize}
        title={maximized ? "Restore" : "Maximize"}
        aria-label={maximized ? "Restore" : "Maximize"}
      >
        {maximized ? <RestoreIcon /> : <MaximizeIcon />}
      </UnstyledButton>
      <UnstyledButton
        className={`${styles.button} ${styles.closeButton}`}
        onClick={close}
        title="Close"
        aria-label="Close"
      >
        <CloseIcon />
      </UnstyledButton>
    </Group>
  );
}

export default WindowControls;
