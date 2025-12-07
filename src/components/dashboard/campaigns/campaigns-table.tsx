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
              <TableCell>{c.name}</TableCell>
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
                    <button
                      className="text-xs text-muted-foreground underline"
                      onClick={async () => {
                        try {
                          const res = await fetch(c.dlrExportUrl as string);
                          if (!res.ok) throw new Error(`Failed to fetch DLR CSV: ${res.status}`);
                          const text = await res.text();
                          // parse CSV simple: first line header, then rows like: messageId,msisdn,dlrStatus,...
                          const rows = text.trim().split(/\r?\n/).slice(1).map(r=>r.split(","));
                          let delivered = 0;
                          let failed = 0;
                          let pending = 0;
                          for (const r of rows) {
                            const status = String(r[2] || "").toLowerCase();
                            if (status === "delivered") delivered++;
                            else if (status === "failed") failed++;
                            else pending++;
                          }
                          alert(`DLR summary:\nDelivered: ${delivered}\nFailed: ${failed}\nPending/other: ${pending}`);
                        } catch (err: any) {
                          console.error(err);
                          alert(`Unable to load DLR summary: ${String(err?.message || err)}`);
                        }
                      }}
                      title="Show quick DLR summary (delivered/failed)"
                    >
                      Summary
                    </button>
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
