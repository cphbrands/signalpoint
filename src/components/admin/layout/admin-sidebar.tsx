"use client";

import {DollarSign, FileText, MessageCircle, Settings, Users2, CreditCard} from "lucide-react";
import * as React from "react";

import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail} from "@/components/ui/sidebar";
import {Branding} from "./admin-branding";
import {SidebarLinks} from "./admin-sidebar-links";
import {SidebarUser} from "./admin-sidebar-user";

// This is sample data.
const routes = [
    {
        name: "Overview",
        href: "/admin",
        icon: FileText,
    },
    {
        name: "Campaigns",
        href: "/admin/campaigns",
        icon: MessageCircle,
    },
    {
        name: "Credits",
        href: "/admin/credits",
        icon: CreditCard,
    },
    {
        name: "Payments",
        href: "/admin/payments",
        icon: DollarSign,
    },
    {
        name: "Users",
        href: "/admin/users",
        icon: Users2,
    },
    {
        name: "HLR",
        href: "/admin/hlr",
        icon: FileText,
    },
    {
        name: "Settings",
        href: "/admin/account",
        icon: Settings,
    },
];

export function AdminDashboardSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
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
