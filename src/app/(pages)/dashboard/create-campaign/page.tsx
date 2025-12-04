"use client";

import UserDashboardLayout from "@/components/dashboard/layout/user-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/firebase-context";
import { auth, storage } from "@/firebase";
import useCurrentCredits from "@/hooks/use-current-credit";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function CreateCampaign() {
    const cleanSenderId = (v: string) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);

  const { user } = useUser();
  const userCurrentCredits = useCurrentCredits();

  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sendType, setSendType] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [serverPreview, setServerPreview] = useState<{
    contactCount: number;
    requiredCredits: number;
    segments: number;
    campaignId: string;
    status: string;
  } | null>(null);

  const getSegments = (msg: string) => {
    const len = msg.length;
    if (len === 0) return 0;
    if (len <= 160) return 1;
    if (len <= 306) return 2;
    if (len <= 459) return 3;
    return Math.ceil(len / 153);
  };

  const segments = useMemo(() => getSegments(message), [message]);

  const validate = () => {
    if (!campaignName.trim()) return "Campaign name is required!";
    if (!message.trim()) return "Message cannot be empty!";
    if (!file) return "Please upload a CSV/XLS/XLSX file!";
    if (!user) return "User not found!";
    if (sendType === "later") {
      const d = new Date(scheduledDate);
      if (!scheduledDate || Number.isNaN(d.getTime())) return "Please choose a valid scheduled date!";
      if (d <= new Date()) return "Scheduled date must be in the future!";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setServerPreview(null);

    const errorMessage = validate();
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setLoading(true);

    try {
      // Upload file to Firebase Storage
      const fileRef = ref(storage, `campaign-files/${user!.uid}/${Date.now()}-${file!.name}`);
      await uploadBytes(fileRef, file!);
      const fileURL = await getDownloadURL(fileRef);

      // Call server: parses file + calculates credits + deducts credits + creates campaign
      const token = await auth.currentUser?.getIdToken();
if (!token) {
  setError("Not logged in (no token). Please login again.");
  return;
}

      const res = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: campaignName,
          message,
          fileURL,
          fileName: file?.name || "contacts.csv",
          sendType,
          scheduledAt: sendType === "later" ? new Date(scheduledDate).toISOString() : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "INSUFFICIENT_CREDITS") {
          setError(`Not enough credits. Needed: ${data.needed}`);
        } else {
          setError(data?.error || "Failed to create campaign. Try again.");
        }
        return;
      }

      setServerPreview({
        contactCount: data.contactCount,
        requiredCredits: data.requiredCredits,
        segments: data.segments,
        campaignId: data.campaignId,
        status: data.status,
      });

      alert("Campaign created successfully!");

      setCampaignName("");
      setMessage("");
      setFile(null);
      setScheduledDate("");
      setSendType("now");
    } catch (err) {
      console.error(err);
      setError("Failed to create campaign. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserDashboardLayout>
      <div className="container py-8 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Create SMS Campaign</h1>
            <p className="text-muted-foreground mt-1">
              Create a new SMS campaign to send messages to your contacts
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link href="/dashboard/campaigns">All Campaigns</Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg space-y-6 border p-6 bg-card">
          {error && <p className="text-red-600 font-medium bg-red-50 p-2 rounded">⚠ {error}</p>}

          <div>
            <Label className="mb-2">Sender ID</Label>
            <Input
              type="text"
              placeholder="Enter sender id (e.g. SIGNAL)"
              value={campaignName}
              onChange={(e) => setCampaignName(cleanSenderId(e.target.value))}
            />
                        <p className="text-xs text-muted-foreground mt-1">
                            Max 11 tegn (A–Z/0–9). {campaignName.length}/11 — {11 - campaignName.length} tilbage{campaignName ? ` • Sendes som: ${campaignName}` : ""}
                        </p>
          </div>

          <div>
            <Label className="mb-2">Message</Label>
            <Textarea
              placeholder="Type your SMS message..."
              value={message}
              className="resize-none h-32"
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Characters: {message.length} | Segments (estimate): {segments}
            </p>
          </div>

          <div>
            <Label className="mb-2">Upload File (CSV/XLS/XLSX)</Label>
            <Input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="text-sm text-gray-500 mt-1">
              <strong>Instructions:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Upload your contacts file in CSV/XLS/XLSX format.</li>
                <li>Recipients + credits are calculated server-side (anti-cheat).</li>
              </ul>
            </div>
          </div>

          <div>
            <Label className="mb-2">Send Option</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="radio" checked={sendType === "now"} onChange={() => setSendType("now")} />
                Now
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={sendType === "later"} onChange={() => setSendType("later")} />
                Later
              </label>
            </div>
            {sendType === "later" && (
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <Card>
            <CardContent>
              <div className="flex items-start">
                <Info className="h-5 w-5 mr-2 font-medium flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Campaign Summary</h3>
                  <ul className="text-sm font-medium space-y-1">
                    <li>Your credits: {userCurrentCredits ?? "—"}</li>
                    <li>Message length: {message.length} characters</li>
                    <li>Segments (estimate): {segments}</li>
                    <li>Recipients: {serverPreview ? serverPreview.contactCount : "Calculated on submit"}</li>
                    <li>Total credits required: {serverPreview ? serverPreview.requiredCredits : "Calculated on submit"}</li>
                    {scheduledDate && <li>Scheduled for: {new Date(scheduledDate).toLocaleString()}</li>}
                    {serverPreview && <li className="text-green-700">Created: {serverPreview.campaignId} ({serverPreview.status})</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Campaign"
            )}
          </Button>
        </form>
      </div>
    </UserDashboardLayout>
  );
}
