"use client";

import {Button} from "@/components/ui/button";
import {useUser} from "@/context/firebase-context";
import {db} from "@/firebase";
import {collection, onSnapshot, query, Timestamp, where} from "firebase/firestore";
import {Loader2} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button as UiButton } from "@/components/ui/button";
import CampaignTable from "../campaigns/campaigns-table";
import NoCampaigns from "../campaigns/no-campaigns";

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
  // DLR export
  dlrExportUrl?: string | null;
  dlrDone?: boolean;

}

export default function RecentCampaigns() {
    const {user} = useUser();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "campaigns"), where("userId", "==", user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Campaign[] = snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    id: doc.id,
                    // DLR export
                    senderId: (d as any).senderId || (d as any).sender || null,
                    name: d.name,
                    message: d.message || "",
                    contactCount: d.contactCount || 0,
                    segments: d.segments || 0,
                    requiredCredits: d.requiredCredits || 0,
                    delivered: d.delivered || 0,
                    status: d.status,
                    createdAt: d.createdAt,
                    scheduledAt: d.scheduledAt || "",
                    // DLR export
                    dlrExportUrl: (d as any).dlrExportUrl ?? null,
                    dlrDone: Boolean((d as any).dlrDone),
                };
            });
            setCampaigns(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading)
        return (
            <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold ">Recent Campaigns</h2>
                <Button>
                    <Link href="/dashboard/campaigns">View All</Link>
                </Button>
            </div>
            {/* Persistent banner */}
            <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-white shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <strong className="text-slate-900">Number Alive/dead</strong>
                    <span className="text-sm text-slate-700">Low send (accepted) rate? Do an HLR to get higher delivery and save money.</span>
                </div>
                <div>
                    <Link href="/dashboard/hlr" className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white shadow-sm">
                        Run check
                    </Link>
                </div>
            </div>

            {/* Incentive banner: show if average accepted rate is low */}
            {(() => {
                const withCounts = campaigns.filter(c => c.contactCount && c.contactCount > 0);
                if (withCounts.length === 0) return null;
                const sumPct = withCounts.reduce((acc, c) => acc + (c.delivered / c.contactCount), 0);
                const avgPct = Math.round((sumPct / withCounts.length) * 100);
                if (avgPct < 70) {
                    return (
                        <div className="mb-4 p-3 rounded-lg border border-amber-300 bg-white shadow-sm text-amber-900 flex items-center justify-between">
                            <div>
                                <div className="font-semibold">Low delivery rate detected ({avgPct}% accepted)</div>
                                <div className="text-sm text-slate-800">Run a Number Alive/dead check to remove invalid numbers and lift delivery.</div>
                            </div>
                            <div>
                                <Link href="/dashboard/hlr" className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-sm font-semibold text-white shadow-sm">
                                    Run check
                                </Link>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Low-rate modal when avg < 80% */}
            <LowRateModalOverview campaigns={campaigns} />

            {campaigns.length > 0 ? <CampaignTable campaigns={campaigns.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()).slice(0,5)} /> : <NoCampaigns />}
        </div>
    );
}

function LowRateModalOverview({ campaigns }: { campaigns: any[] }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!campaigns || campaigns.length === 0) return;
        const key = "hlr_low_rate_overview_dismissed";
        try {
            const dismissed = localStorage.getItem(key);
            if (dismissed === "true") return;
        } catch (e) {}

        const withCounts = campaigns.filter(c => c.contactCount && c.contactCount > 0);
        if (withCounts.length === 0) return;
        const sumPct = withCounts.reduce((acc, c) => acc + (c.delivered / c.contactCount), 0);
        const avgPct = Math.round((sumPct / withCounts.length) * 100);
        if (avgPct < 80) setOpen(true);
    }, [campaigns]);

    const dismissPermanently = () => {
        try { localStorage.setItem("hlr_low_rate_overview_dismissed", "true"); } catch (e) {}
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Improve delivery with Number Alive/dead</DialogTitle>
                    <DialogDescription>
                        Your recent campaigns show below 80% accepted rate. Running a Number Alive/dead check removes invalid numbers and increases delivery while saving credits.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <UiButton asChild>
                        <Link href="/dashboard/hlr">Run Number Alive/dead</Link>
                    </UiButton>
                    <UiButton variant="ghost" onClick={dismissPermanently} className="ml-2">Don't show again</UiButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
