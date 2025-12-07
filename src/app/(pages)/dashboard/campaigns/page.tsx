"use client";

import CampaignsFilters from "@/components/dashboard/campaigns/campaigns-filter";
import CampaignTable from "@/components/dashboard/campaigns/campaigns-table";
import NoCampaigns from "@/components/dashboard/campaigns/no-campaigns";
import UserDashboardLayout from "@/components/dashboard/layout/user-dashboard-layout";
import {Button} from "@/components/ui/button";
import {useUser} from "@/context/firebase-context";
import {db} from "@/firebase";
import {collection, onSnapshot, query, Timestamp, where} from "firebase/firestore";
import {Loader2, Send} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";

import { Campaign } from "@/types/campaign";
export default function Campaigns() {
    const {user} = useUser();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");

    useEffect(() => {
        if (!user) return;

        const q = query(
          collection(db, "campaigns"),
          where("userId", "==", user.uid)
        );
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                // build plain array first, then try to sort/set state
                const docs = snapshot.docs.map((doc) => {
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
                        dlrExportUrl: (d as any).dlrExportUrl ?? null,
                        dlrDone: Boolean((d as any).dlrDone),
                        createdAt: d.createdAt,
                        scheduledAt: d.scheduledAt || "",
                    } as Campaign;
                });

                try {
                    const data: Campaign[] = docs;
                    data.sort((a: any, b: any) => (b.createdAt?.toDate?.()?.getTime?.() || 0) - (a.createdAt?.toDate?.()?.getTime?.() || 0));
                    setCampaigns(data);
                } catch (e) {
                    console.error("[Campaigns] onSnapshot render/map error:", e);
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error("[Campaigns] onSnapshot error:", err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const filteredCampaigns = campaigns
        .filter((c) => {
            const matchesSearch =
                String(c.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(c.message ?? "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
                const getTime = (x: any) => {
                    if (!x) return 0;
                    if (typeof x?.toDate === "function") return x.toDate().getTime();
                    return new Date(String(x)).getTime();
                };

                if (sortBy === "date") return getTime(b.createdAt) - getTime(a.createdAt);
                if (sortBy === "name") return a.name.localeCompare(b.name);
                return 0;
            });

    if (loading)
        return (
            <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );

    return (
        <UserDashboardLayout>
            <div className="container mx-auto py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Campaigns</h1>
                        <p className="text-muted-foreground mt-1">Manage your SMS campaigns</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Button asChild>
                            <Link href="/dashboard/create-campaign">
                                <Send className="mr-2 h-4 w-4" /> New Campaign
                            </Link>
                        </Button>
                    </div>
                </div>

                <CampaignsFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />

                {filteredCampaigns.length > 0 ? <CampaignTable campaigns={filteredCampaigns} /> : <NoCampaigns />}
            </div>
        </UserDashboardLayout>
    );
}
