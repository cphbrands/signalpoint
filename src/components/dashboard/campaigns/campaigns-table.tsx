"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Campaign } from "@/types/campaign";
import CampaignStatusBadge from "./user-campaigns-badge";

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
          <TableHead title="Number of messages accepted/sent to the provider (not necessarily final DLR)">Sent (accepted)</TableHead>
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

          const createdDate = typeof (c.createdAt as any)?.toDate === "function"
            ? (c.createdAt as any).toDate().toLocaleDateString()
            : new Date(String(c.createdAt)).toLocaleDateString();

          return (
            <TableRow key={c.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    {c.senderId ? (
                      <span className="text-xs text-muted-foreground">Sender: {c.senderId}</span>
                    ) : null}
                  </div>
                </TableCell>
              <TableCell className="max-w-sm whitespace-normal break-words">{c.message}</TableCell>
              <TableCell>{c.contactCount}</TableCell>
              <TableCell>{c.segments}</TableCell>
              <TableCell>{c.requiredCredits}</TableCell>
              <TableCell>{createdDate}</TableCell>
              <TableCell>{deliveryDate}</TableCell>
              <TableCell>
                {c.delivered} ({pct}%)
              </TableCell>

              <TableCell>
                {c.dlrExportUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={c.dlrExportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                      title="Download delivery report as CSV"
                    >
                      Download
                    </a>
                  </div>
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
