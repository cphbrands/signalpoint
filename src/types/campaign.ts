import { Timestamp } from "firebase/firestore";

export interface Campaign {
  id: string;
  name: string;
  message: string;
  // sender id (alphanumeric short sender name)
  senderId?: string | null;
  contactCount: number;
  segments: number;
  requiredCredits: number;
  delivered: number;
  createdAt: Timestamp | string | number | null;
  scheduledAt: string | Timestamp | number | null;
  status: "completed" | "scheduled" | "failed";

  // DLR export
  dlrExportUrl?: string | null;
  dlrDone?: boolean;
}
