"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Timestamp } from "firebase/firestore";
import CampaignStatusBadge from "./user-campaigns-badge";

interface Campaign {
  id: string;
  name: string;
  message: string;
  contactCount: number;
  segments: number;
  requiredCredits: number;
  delivered: number;
  createdAt: Timestamp;
  scheduledAt: string | Timestamp;
  status: "completed" | "scheduled" | "failed";

  // NEW
  dlrExportUrl?: string | null;
  dlrDone?: boolean;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns }) => (
  <div className="overflow-x-auto">
    <Table className="w-full border">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Recipients</TableHead>
          <TableHead>Segments</TableHead>
          <TableHead>Credit Spend</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Delivery Date</TableHead>
          <TableHead>Delivered</TableHead>
          <TableHead>DLR</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {campaigns.map((c) => {
          const pct = c.contactCount > 0 ? Math.round((c.delivered * 100) / c.contactCount) : 0;

          const deliveryDate =
            c.scheduledAt === "instant"
              ? "Instant"
              : typeof (c.scheduledAt as any)?.toDate === "function"
                ? (c.scheduledAt as any).toDate().toLocaleString()
                : new Date(String(c.scheduledAt)).toLocaleString();

          return (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell className="max-w-sm whitespace-normal break-words">{c.message}</TableCell>
              <TableCell>{c.contactCount}</TableCell>
              <TableCell>{c.segments}</TableCell>
              <TableCell>{c.requiredCredits}</TableCell>
              <TableCell>{c.createdAt.toDate().toLocaleDateString()}</TableCell>
              <TableCell>{deliveryDate}</TableCell>
              <TableCell>
                {c.delivered} ({pct}%)
              </TableCell>

              <TableCell>
                {c.dlrExportUrl ? (
                  <a
                    href={c.dlrExportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    title="Download delivery report as CSV"
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell>
                <CampaignStatusBadge status={c.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default CampaignTable;
