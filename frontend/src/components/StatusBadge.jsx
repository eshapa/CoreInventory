import { cn } from "../lib/utils";

function StatusBadge({ status, variant = "stock" }) {

  const getClasses = () => {

    if (variant === "operation") {

      switch (status) {

        case "receipt":
          return "bg-success/10 text-success";

        case "delivery":
          return "bg-primary/10 text-primary";

        case "transfer":
          return "bg-warning/10 text-warning";

        case "adjustment":
          return "bg-muted text-muted-foreground";

        default:
          return "bg-muted text-muted-foreground";
      }
    }

    switch (status) {

      case "in-stock":
        return "bg-success/10 text-success";

      case "low-stock":
        return "bg-warning/10 text-warning";

      case "out-of-stock":
        return "bg-destructive/10 text-destructive";

      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const label = status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={cn("status-badge", getClasses())}>
      {label}
    </span>
  );
}

export default StatusBadge;