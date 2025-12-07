/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import CampaignFilters from "@/components/admin/campaigns/admin-campaigns-filter";
import CampaignStats from "@/components/admin/campaigns/admin-campaigns-stats";
import AdminDeliveryCampaigns from "@/components/admin/campaigns/admin-delivery-campaigns";
import AdminDashboardLayout from "@/components/admin/layout/admin-layout";
import {db} from "@/firebase";
import {collection, onSnapshot, query} from "firebase/firestore";
import {Loader2} from "lucide-react";
import {useEffect, useState} from "react";

export default function AdminCampaigns() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");

    useEffect(() => {
        const q = query(collection(db, "campaigns"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            setCampaigns(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredCampaigns = campaigns
        .filter((c) => {
            // Defensive: some campaign docs may have null/undefined name/message
            const name = String(c?.name ?? "");
            const message = String(c?.message ?? "");
            const matchesSearch =
                name.toLowerCase().includes(String(searchTerm ?? "").toLowerCase()) ||
                message.toLowerCase().includes(String(searchTerm ?? "").toLowerCase());
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
            if (sortBy === "name") return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
            return 0;
        });

    if (loading)
        return (
            <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );

    return (
        <AdminDashboardLayout>
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-8">All Campaigns</h1>

                <CampaignStats campaigns={campaigns} />
                <CampaignFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />

                <AdminDeliveryCampaigns campaigns={filteredCampaigns} />
            </div>
        </AdminDashboardLayout>
    );
}
