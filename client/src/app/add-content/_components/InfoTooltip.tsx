import styles from "../page.module.css";

// Keyboard/hover-accessible hint bubble — CSS-only (:hover/:focus-visible),
// no open/close state to manage.
export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className={styles.tooltipWrap} tabIndex={0}>
      <span className={styles.tooltipIcon} aria-hidden="true">
        i
      </span>
      <span className={styles.tooltipBubble} role="tooltip">
        {text}
      </span>
    </span>
  );
}
