"use client";

import { useState } from "react";
import AdminDashboardLayout from "@/components/admin/layout/admin-layout";
import { auth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCreditsPage() {
  const [emailOrUid, setEmailOrUid] = useState("");
  const [delta, setDelta] = useState<string>("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [grantAllAmount, setGrantAllAmount] = useState<string>("");
  const [grantAllReason, setGrantAllReason] = useState<string>("");
  const [grantMsg, setGrantMsg] = useState<string>("");

  async function adjust() {
    setMsg("");
    if (!auth.currentUser) return setMsg("Not logged in.");

    const token = await auth.currentUser.getIdToken();

    const payload =
      emailOrUid.includes("@")
        ? { email: emailOrUid.trim(), mode: "delta", delta: Number(delta), reason }
        : { uid: emailOrUid.trim(), mode: "delta", delta: Number(delta), reason };

    const res = await fetch("/api/admin/credits/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) return setMsg(`Error: ${data?.error || res.status}`);

    setMsg(`OK: ${data.uid} credits ${data.before} → ${data.after}`);
  }

  async function grantAll() {
    setGrantMsg("");
    if (!auth.currentUser) return setGrantMsg("Not logged in.");
    const token = await auth.currentUser.getIdToken();
    const credits = Math.trunc(Number(grantAllAmount || 0));
    if (!Number.isFinite(credits) || credits === 0) return setGrantMsg("Invalid amount");

    const res = await fetch("/api/admin/credits/grant-all", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ credits, reason: grantAllReason }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) return setGrantMsg(`Error: ${data?.error || res.status}`);
    setGrantMsg(`OK: granted ${data.credits} credits to ${data.updated} users`);
  }

  return (
    <AdminDashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-xl space-y-4">
        <h1 className="text-3xl font-bold">Adjust Credits</h1>
        <p className="text-muted-foreground">Use negative delta to subtract credits.</p>

        <Input value={emailOrUid} onChange={(e) => setEmailOrUid(e.target.value)} placeholder="User email or UID" />
        <Input value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="Delta (e.g. 500 or -200)" />
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />

        <Button onClick={adjust}>Apply</Button>

        {msg && <div className="text-sm">{msg}</div>}

  <hr className="my-6" />

  <h2 className="text-2xl font-semibold">Grant credits to all users</h2>
  <p className="text-muted-foreground">This will add credits to every user account. Use with caution.</p>
  <Input value={grantAllAmount} onChange={(e) => setGrantAllAmount(e.target.value)} placeholder="Amount (e.g. 100)" />
  <Input value={grantAllReason} onChange={(e) => setGrantAllReason(e.target.value)} placeholder="Reason (optional)" />
  <Button variant="destructive" onClick={grantAll}>Grant to all users</Button>
  {grantMsg && <div className="text-sm mt-2">{grantMsg}</div>}
      </div>
    </AdminDashboardLayout>
  );
}
