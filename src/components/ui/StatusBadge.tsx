"use client";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status.toUpperCase()) {
      case "SUBMITTED":
      case "SUCCESS":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          color: "#34d399",
          border: "rgba(16, 185, 129, 0.3)",
          glow: "0 0 10px rgba(16, 185, 129, 0.2)"
        };
      case "QUEUED":
      case "NEW":
        return {
          bg: "rgba(245, 158, 11, 0.15)",
          color: "#fbbf24",
          border: "rgba(245, 158, 11, 0.3)",
          glow: "0 0 10px rgba(245, 158, 11, 0.2)"
        };
      case "FAILED":
      case "ERROR":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          color: "#f87171",
          border: "rgba(239, 68, 68, 0.3)",
          glow: "0 0 10px rgba(239, 68, 68, 0.2)"
        };
      case "REVIEW":
      case "PENDING":
        return {
          bg: "rgba(139, 92, 246, 0.15)",
          color: "#c084fc",
          border: "rgba(139, 92, 246, 0.3)",
          glow: "0 0 10px rgba(139, 92, 246, 0.2)"
        };
      default:
        return {
          bg: "rgba(255, 255, 255, 0.1)",
          color: "rgba(255, 255, 255, 0.8)",
          border: "rgba(255, 255, 255, 0.2)",
          glow: "none"
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.75rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.05em",
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        boxShadow: styles.glow,
        textTransform: "uppercase"
      }}
    >
      {status}
    </span>
  );
}
