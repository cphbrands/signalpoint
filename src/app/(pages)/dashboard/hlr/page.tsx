"use client";
import HlrLookup from "./hlr-lookup";
import UserDashboardLayout from "@/components/dashboard/layout/user-dashboard-layout";

export default function HlrPage() {
  return (
    <UserDashboardLayout>
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">HLR Lookup</h1>
          <p className="text-muted-foreground mt-1">
            Check phone numbers active status via CSV upload
          </p>
        </div>
        <HlrLookup />
      </div>
    </UserDashboardLayout>
  );
}
