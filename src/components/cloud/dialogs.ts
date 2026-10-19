import type { DestinationId, TemplateId } from "@/lib/cloud/types";
import type { ScheduleDraft } from "./ScheduleDialog";

export type DialogRequest =
  | { type: "share" }
  | { type: "email"; templateId?: TemplateId }
  | { type: "sheets" }
  | { type: "connect"; id: DestinationId }
  | { type: "schedule"; initial?: ScheduleDraft }
  | { type: "preview"; id: TemplateId };

export type OpenDialog = (req: DialogRequest) => void;
