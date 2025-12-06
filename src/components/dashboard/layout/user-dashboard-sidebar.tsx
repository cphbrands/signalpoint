"use client";

import { CreditCard, DollarSign, FileText, Grid2X2, MessageCircle, User, Search } from "lucide-react";
import * as React from "react";

import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail} from "@/components/ui/sidebar";
import {Branding} from "./user-branding";
import {SidebarUser} from "./user-sidebar";
import {SidebarLinks} from "./user-sidebar-links";

// This is sample data.

const routes = [
    {
        name: "Overview",
        href: "/dashboard",
        icon: FileText,
    },
    {
        name: "Create Campaign",
        href: "/dashboard/create-campaign",
        icon: MessageCircle,
    },
    {
        name: "Campaigns",
        href: "/dashboard/campaigns",
        icon: Grid2X2,
    },
    {
        name: "Buy Credits",
        href: "/dashboard/buy-credits",
        icon: DollarSign,
    },
    {
        name: "Billings",
        href: "/dashboard/billings",
        icon: CreditCard,
    },        { name: "HLR Lookup", href: "/dashboard/hlr", icon: Search },

    {
        name: "Account",
        href: "/dashboard/account",
        icon: User,
    },
];

export function DashboardSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="">
                <Branding />
            </SidebarHeader>
            <SidebarContent>
                <SidebarLinks routes={routes} />
            </SidebarContent>
            <SidebarFooter>
                <SidebarUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
