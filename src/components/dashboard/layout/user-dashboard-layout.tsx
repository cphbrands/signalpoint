"use client";

import {DashboardSidebar} from "@/components/dashboard/layout/user-dashboard-sidebar";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {ThemeToggler} from "@/components/ui/theme-toggler";
import PrivateRoute from "@/context/private-route-provider";
import useCurrentCredits from "@/hooks/use-current-credit";
import {ReactNode} from "react";

export default function UserDashboardLayout({children}: {children: ReactNode}) {
    const credits = useCurrentCredits();

    return (
        <PrivateRoute>
            <SidebarProvider>
                <DashboardSidebar />
                <SidebarInset>
                    <header className="flex h-16 border-b sticky top-0 bg-background shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center justify-between w-full px-4">
                            <div className="flex items-center gap-2">
                                <SidebarTrigger className="-ml-1" />
                                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                            </div>
                            <div className="flex items-center  gap-4">
                                <Button variant="outline">
                                    Credits :<span className="font-semibold">{credits}</span>
                                </Button>

                                <ThemeToggler />
                            </div>
                        </div>
                    </header>
                    <div className="p-4 pt-0">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </PrivateRoute>
    );
}
