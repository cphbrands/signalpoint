"use client";

import {SidebarMenu, SidebarMenuButton, SidebarMenuItem} from "@/components/ui/sidebar";
import {MessageCircle} from "lucide-react";
import {useRouter} from "next/navigation";

export function Branding() {
    const router = useRouter();
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    onClick={() => router.push("/")}
                >
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <MessageCircle className="size-4" />
                    </div>
                    <h2 className="text-xl text-black  dark:text-white font-semibold tracking-wider">Signal Point</h2>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
