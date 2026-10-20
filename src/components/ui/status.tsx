import {
  Check,
  CheckCircle,
  MagnifyingGlass,
  PaperPlaneTilt,
  Prohibit,
  Warning,
  Wrench,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { Status } from "@/lib/types";

/** Fixed icon per status (brief section 2.2). Phosphor Light only. */
export const STATUS_ICONS: Record<Status, Icon> = {
  submitted: PaperPlaneTilt,
  under_review: MagnifyingGlass,
  in_progress: Wrench,
  resolved: Check,
  confirmed: CheckCircle,
  disputed: Warning,
  rejected: Prohibit,
};
