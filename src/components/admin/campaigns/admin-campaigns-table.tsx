"use client";

import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Timestamp} from "firebase/firestore";
import {Download, Pencil} from "lucide-react";

interface Campaign {
    id: string;
    userId: string;
    name: string;
    message: string;
    contactCount: number;
    segments: number;
    fileURL: string;
    requiredCredits: number;
    delivered: number;
    createdAt: Timestamp;
    scheduledAt: string | Timestamp;
    status: "completed" | "scheduled" | "failed";
}

interface CampaignTableProps {
    campaigns: Campaign[];
    onStatusChange: (id: string, newStatus: Campaign["status"]) => void;
    onUpdateDelivered: (campaign: Campaign) => void;
}

export default function CampaignTable({campaigns, onStatusChange, onUpdateDelivered}: CampaignTableProps) {
    return (
        <div className="overflow-x-auto">
            <Table className="border">
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Segments</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Delivery Date</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="p-4 text-center text-muted-foreground">
                                No campaigns found
                            </TableCell>
                        </TableRow>
                    ) : (
                        campaigns.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>{c.name}</TableCell>
                                <TableCell className="max-w-sm break-words whitespace-normal pr-5">
                                    {c.message}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div>{c.contactCount}</div>
                                        <a href={c.fileURL} target="_blank" className="text-blue-600">
                                            <Download size={16} /> 
                                        </a>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">{c.segments}</TableCell>
                                <TableCell>{c.createdAt.toDate().toLocaleDateString()}</TableCell>
                                <TableCell>
                                    {c.scheduledAt === "instant"
                                        ? "Instant"
                                        : new Date(c.scheduledAt.toString()).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center">
                                        {c.delivered}
                                        <Button variant="ghost" size="icon" onClick={() => onUpdateDelivered(c)}>
                                            <Pencil size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={c.status}
                                        onValueChange={(value: Campaign["status"]) => onStatusChange(c.id, value)}
                                    >
                                        <SelectTrigger
                                            className={`
                                         px-2 py-1 rounded-full text-sm font-semibold
                                         ${c.status === "completed" ? "bg-green-100 text-green-800" : ""}
                                         ${c.status === "scheduled" ? "bg-blue-100 text-blue-800" : ""}
                                         ${c.status === "failed" ? "bg-red-100 text-red-800" : ""}
                                        `}
                                        >
                                            <SelectValue>
                                                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="scheduled">Scheduled</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
