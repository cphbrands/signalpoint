"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
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
          <TableHead>Suggestion</TableHead>
          <TableHead>DLR</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {campaigns.map((c) => {
          const pct = c.contactCount > 0 ? Math.round((c.delivered * 100) / c.contactCount) : 0;
          const rate = c.contactCount > 0 ? c.delivered / c.contactCount : null;

          let deliveryDate = "—";
          if (c.scheduledAt === "instant") {
            deliveryDate = "Instant";
          } else if (c.scheduledAt) {
            if (typeof (c.scheduledAt as any)?.toDate === "function") {
              const d = (c.scheduledAt as any).toDate();
              deliveryDate = Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
            } else {
              const parsed = new Date(String(c.scheduledAt));
              deliveryDate = Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString();
            }
          }

          const createdDate = typeof (c.createdAt as any)?.toDate === "function"
            ? (c.createdAt as any).toDate().toLocaleDateString()
            : new Date(String(c.createdAt)).toLocaleDateString();

          return (
            <TableRow key={c.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{c.name}</span>
                  {c.senderId ? (
                    <span className="text-xs text-muted-foreground">Sender: {c.senderId}</span>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        rate !== null && rate < 0.8
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                      title={rate !== null ? `Accepted ${(rate * 100).toFixed(0)}%` : "No sends yet"}
                    >
                      {rate !== null && rate < 0.8 ? "Low delivery" : "Number Alive/dead"}
                    </span>
                    <Link href="/dashboard/hlr" className="text-xs text-primary underline">
                      Run check
                    </Link>
                  </div>
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
                {c.contactCount > 0 && pct < 70 ? (
                  <div className="text-xs inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    <span>Low accepted rate ({pct}%)</span>
                    <a href="/dashboard/hlr" className="underline">Run Number Alive/dead</a>
                  </div>
                ) : null}
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
