"use client";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Timestamp} from "firebase/firestore";
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
}

interface CampaignTableProps {
    campaigns: Campaign[];
}

const CampaignTable: React.FC<CampaignTableProps> = ({campaigns}) => (
    <div className="overflow-x-auto">
        <Table className="w-full border ">
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
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {campaigns.map((c) => (
                    <TableRow key={c.id}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell className="max-w-sm whitespace-normal break-words">{c.message}</TableCell>
                        <TableCell>{c.contactCount}</TableCell>
                        <TableCell>{c.segments}</TableCell>
                        <TableCell>{c.requiredCredits}</TableCell>
                        <TableCell>{c.createdAt.toDate().toLocaleDateString()}</TableCell>
                        <TableCell>
                            {c.scheduledAt === "instant"
  ? "Instant"
  : (typeof (c.scheduledAt as any)?.toDate === "function"
      ? (c.scheduledAt as any).toDate().toLocaleString()
      : new Date(String(c.scheduledAt)).toLocaleString()
    )}
                        </TableCell>
                        <TableCell>
                            {c.delivered} {" "} ({((c.delivered * 100) / c.contactCount).toFixed(0)}%){" "}
                        </TableCell>
                        <TableCell>
                            <CampaignStatusBadge status={c.status} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);

export default CampaignTable;
