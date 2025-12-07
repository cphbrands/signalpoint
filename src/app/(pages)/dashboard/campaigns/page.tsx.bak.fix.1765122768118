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
export default function Campaigns() {
    const {user} = useUser();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");

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
            dlrExportUrl: (data as any).dlrExportUrl ?? null,
            dlrDone: Boolean((data as any).dlrDone),
                    createdAt: d.createdAt,
                    scheduledAt: d.scheduledAt || "",
                };
            });
            setCampaigns(data);
            setLoading(false);
        });

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
            if (sortBy === "date") return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
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
