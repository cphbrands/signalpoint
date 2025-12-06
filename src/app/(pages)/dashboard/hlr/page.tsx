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
            Validate phone numbers via CSV upload (mock provider).
          </p>
        </div>
        <HlrLookup />
      </div>
    </UserDashboardLayout>
  );
}
