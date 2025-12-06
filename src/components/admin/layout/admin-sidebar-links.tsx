"use client";

import {type LucideIcon} from "lucide-react";

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {usePathname} from "next/navigation";

export function SidebarLinks({
    routes,
}: {
    routes: {
        name: string;
        href: string;
        icon: LucideIcon;
    }[];
}) {
    const location = usePathname();

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarMenu>
                {routes.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                            asChild
                            className={`font-medium    ${
                                location === item.href
                                    ? "bg-primary text-white hover:bg-primary hover:text-white font-semibold tracking-wide"
                                    : "text-black dark:hover:text-black dark:text-white"
                            }  `}
                        >
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
