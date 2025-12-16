"use client";


import * as XLSX from "xlsx";
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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function CreateCampaign() {
    const [countryCode, setCountryCode] = useState("45");
    const [nationalNumberLength, setNationalNumberLength] = useState(8);

    
    function normalizePhoneCandidate(v: any): string | null {
        const digits = String(v ?? "").replace(/[^\d]/g, "");
        if (!digits) return null;
        return digits;
    }

    function isValidPhone(digits: string): boolean {
        // DK is often 8 digits (or 45+8). Keep it a bit flexible:
        return digits.length >= 8 && digits.length <= 15;
    }

    async function analyzeContactsFile(file: File) {
        const name = (file.name || "").toLowerCase();
        const buf = await file.arrayBuffer();

        let candidates: string[] = [];

        if (name.endsWith(".csv")) {
            const text = new TextDecoder().decode(buf);
            const parts = text.split(/[\s,;\t\r\n]+/g).filter(Boolean);
            for (const part of parts) {
                const d = normalizePhoneCandidate(part);
                if (d) candidates.push(d);
            }
        } else if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
            const wb = XLSX.read(buf, { type: "array" });
            for (const sheetName of wb.SheetNames) {
                const ws = wb.Sheets[sheetName];
                if (!ws) continue;
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
                for (const row of rows as any[]) {
                    for (const cell of (row || [])) {
                        const d = normalizePhoneCandidate(cell);
                        if (d) candidates.push(d);
                    }
                }
            }
        } else {
            // fallback: try to scan as text
            const text = new TextDecoder().decode(buf);
            const parts = text.split(/[\s,;\t\r\n]+/g).filter(Boolean);
            for (const part of parts) {
                const d = normalizePhoneCandidate(part);
                if (d) candidates.push(d);
            }
        }

        const charged = candidates.length;

        // valid candidates
        const valid = candidates.filter(isValidPhone);
        const invalid = charged - valid.length;

        // duplicates counted among valid according to normalized digits
        const seen = new Set<string>();
        let duplicates = 0;
        const uniqueValid: string[] = [];
        for (const d of valid) {
            if (seen.has(d)) { duplicates++; continue; }
            seen.add(d);
            uniqueValid.push(d);
        }

        const sendable = uniqueValid.length;
        return { charged, sendable, invalid, duplicates };
    }
const cleanSenderId = (v: string) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);


type CountryOption = { id: string; label: string; code: string; nationalLen: number };

const COUNTRIES_TOP30: CountryOption[] = [
  { id: "DK", label: "Denmark (+45)", code: "45", nationalLen: 8 },
  { id: "SE", label: "Sweden (+46)", code: "46", nationalLen: 9 },
  { id: "NO", label: "Norway (+47)", code: "47", nationalLen: 8 },
  { id: "FI", label: "Finland (+358)", code: "358", nationalLen: 9 },
  { id: "DE", label: "Germany (+49)", code: "49", nationalLen: 10 },
  { id: "NL", label: "Netherlands (+31)", code: "31", nationalLen: 9 },
  { id: "BE", label: "Belgium (+32)", code: "32", nationalLen: 9 },
  { id: "FR", label: "France (+33)", code: "33", nationalLen: 9 },
  { id: "ES", label: "Spain (+34)", code: "34", nationalLen: 9 },
  { id: "IT", label: "Italy (+39)", code: "39", nationalLen: 10 },
  { id: "PT", label: "Portugal (+351)", code: "351", nationalLen: 9 },
  { id: "PL", label: "Poland (+48)", code: "48", nationalLen: 9 },
  { id: "AT", label: "Austria (+43)", code: "43", nationalLen: 10 },
  { id: "CH", label: "Switzerland (+41)", code: "41", nationalLen: 9 },
  { id: "IE", label: "Ireland (+353)", code: "353", nationalLen: 9 },
  { id: "UK", label: "United Kingdom (+44)", code: "44", nationalLen: 10 },
  { id: "US", label: "United States (+1)", code: "1", nationalLen: 10 },
  { id: "CA", label: "Canada (+1)", code: "1", nationalLen: 10 },
  { id: "AU", label: "Australia (+61)", code: "61", nationalLen: 9 },
  { id: "NZ", label: "New Zealand (+64)", code: "64", nationalLen: 9 },
  { id: "BR", label: "Brazil (+55)", code: "55", nationalLen: 11 },
  { id: "MX", label: "Mexico (+52)", code: "52", nationalLen: 10 },
  { id: "AR", label: "Argentina (+54)", code: "54", nationalLen: 10 },
  { id: "ZA", label: "South Africa (+27)", code: "27", nationalLen: 9 },
  { id: "TR", label: "Turkey (+90)", code: "90", nationalLen: 10 },
  { id: "AE", label: "UAE (+971)", code: "971", nationalLen: 9 },
  { id: "SA", label: "Saudi Arabia (+966)", code: "966", nationalLen: 9 },
  { id: "IN", label: "India (+91)", code: "91", nationalLen: 10 },
  { id: "PK", label: "Pakistan (+92)", code: "92", nationalLen: 10 },
  { id: "PH", label: "Philippines (+63)", code: "63", nationalLen: 10 },
];


  const { user } = useUser();
  const userCurrentCredits = useCurrentCredits();

  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [countryId, setCountryId] = useState("DK");
    const [fileStats, setFileStats] = useState<{ charged:number; sendable:number; invalid:number; duplicates:number; } | null>(null);
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

  // GSM-7 character sets from ETSI TS 123 038 / GSM 03.38
  const GSM7_BASIC = new Set([
    "@","£","$","¥","è","é","ù","ì","ò","Ç","\n","Ø","ø","\r","Å","å",
    "Δ","_","Φ","Γ","Λ","Ω","Π","Ψ","Σ","Θ","Ξ","\u0020","!","\"","#","¤",
    "%","&","'","(",")","*","+",",","-",".","/","0","1","2","3","4","5","6","7","8","9",
  ":",";","<","=",">","?","¡","A","B","C","D","E","F","G","H","I","J","K","L","M","N",
    "O","P","Q","R","S","T","U","V","W","X","Y","Z","Ä","Ö","Ñ","Ü","§","¿","a","b",
    "c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v",
    "w","x","y","z","ä","ö","ñ","ü","à"
  ]);

  // GSM 7-bit extension table: these count as two septets (escape + char)
  const GSM7_EXT = new Set(["^","{","}","\\","[","~","]","|","€"]);

  function analyzeSegments(msg: string) {
    if (!msg) return { encoding: "GSM-7", chars: 0, segments: 0 };

    let usesGsm7 = true;
    let septetCount = 0;

    // iterate over Unicode code points
    for (const ch of Array.from(msg)) {
      if (GSM7_BASIC.has(ch)) {
        septetCount += 1;
      } else if (GSM7_EXT.has(ch)) {
        septetCount += 2; // extension uses escape + char
      } else {
        usesGsm7 = false;
        break;
      }
    }

    if (usesGsm7) {
      const singleLimit = 160;
      const multiLimit = 153;
      const chars = septetCount; // effective septet count
      const segments = chars === 0 ? 0 : chars <= singleLimit ? 1 : Math.ceil(chars / multiLimit);
      return { encoding: "GSM-7", chars, segments };
    }

    // fallback to UCS-2 (Unicode) counting — use code points length
    const codePoints = Array.from(msg).length;
    const singleLimit = 70;
    const multiLimit = 67;
    const segments = codePoints === 0 ? 0 : codePoints <= singleLimit ? 1 : Math.ceil(codePoints / multiLimit);
    return { encoding: "UCS-2", chars: codePoints, segments };
  }

  const segmentsInfo = useMemo(() => analyzeSegments(message), [message]);

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
          countryCode,
          nationalNumberLength,
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
                            Max 11 characters (A–Z/0–9). {campaignName.length}/11 — {11 - campaignName.length} remaining{campaignName ? ` • Will send as: ${campaignName}` : ""}
                        </p>
          </div>
            <div className="grid gap-2 mt-4">
              <Label className="mb-2">Country</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={countryId}
                onChange={(e) => {
                  const next = COUNTRIES_TOP30.find(c => c.id === e.target.value) || COUNTRIES_TOP30[0];
                  setCountryId(next.id);
                  setCountryCode(next.code);
                  setNationalNumberLength(next.nationalLen);
                }}
              >
                {COUNTRIES_TOP30.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Format must be digits only and include the country code. Example (Denmark): 45xxxxxxxx
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
        <div className="grid grid-cols-2 gap-4 mt-4">
        </div>

            <TooltipProvider>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span>Characters: {message.length} | Segments (estimate): {segmentsInfo.segments}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Info about segments">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      We charge per SMS segment, not per line. One segment is up to 160 characters without special characters. If you use emojis or special letters (æ, ø, å, etc.), the limit is about 70 characters per segment, so your text can become 2–3 segments.
                    </TooltipContent>
                </Tooltip>
              </p>
            </TooltipProvider>
          </div>

          <div>
            <Label className="mb-2">Upload File (CSV/XLS/XLSX)</Label>
            <Input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={async (e) => {
  const f = e.target.files?.[0] || null;
  setFile(f);
  if (!f) { setFileStats(null); setContactCount(0); return; }
  try {
    const stats = await analyzeContactsFile(f);
    setFileStats(stats);
    // IMPORTANT: charge credits on "charged" (includes duplicates/invalid)
    setContactCount(stats.charged);
  } catch (err) {
    console.error(err);
    setFileStats(null);
  }
}}
            />
            <div className="text-sm text-gray-500 mt-1">
              <strong>Instructions:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Upload your contacts file in CSV/XLS/XLSX format.</li>
                <li>Recipients + credits are calculated server-side (anti-cheat).</li>
              </ul>
            </div>
            <p className="text-sm text-red-600 mt-2">Please make sure numbers do not start with a "+" and contain no spaces (use country code, e.g. 45xxxxxxxx).</p>
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
                    <li>Segments (estimate): {segmentsInfo.segments}</li>
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

// Temporary fix so build does not fail if setContactCount is used
const setContactCount = (value: number) => {
  // TODO: implement proper contact count state if needed
};
