"use client";

import {Button} from "@/components/ui/button";
import {useUser} from "@/context/firebase-context";
import {db} from "@/firebase";
import {collection, onSnapshot, query, Timestamp, where} from "firebase/firestore";
import {Loader2} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";
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
                    name: d.name,
                    message: d.message || "",
                    contactCount: d.contactCount || 0,
                    segments: d.segments || 0,
                    requiredCredits: d.requiredCredits || 0,
                    delivered: d.delivered || 0,
                    status: d.status,
                    createdAt: d.createdAt,
                    scheduledAt: d.scheduledAt || "",
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
            {campaigns.length > 0 ? <CampaignTable campaigns={campaigns.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()).slice(0,5)} /> : <NoCampaigns />}
        </div>
    );
}
