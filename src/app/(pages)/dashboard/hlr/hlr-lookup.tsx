"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type HlrResult = {
  number: string;
  status: "active" | "inactive" | "unknown" | "error";
  country?: string;
  network?: string;
  mccmnc?: string;
  ported?: boolean;
  note?: string;
};

type HistoryItem = {
  id: string;
  createdAt: string;
  count: number;
  fileName?: string;
  status?: string;
  processed?: number;
  total?: number;
  rawTotal?: number;
};

function extractNumbers(text: string) {
  const matches = text.match(/\d{8,}/g) ?? [];
  const cleaned = matches.map((x) => x.replace(/[^\d]/g, "")).filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  let dup = 0;
  for (const n of cleaned) {
    if (seen.has(n)) dup++;
    else {
      seen.add(n);
      unique.push(n);
    }
  }
  return { totalFound: cleaned.length, uniqueValid: unique.length, duplicates: dup, unique };
}

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  return { error: (await res.text()).slice(0, 300) };
}

function downloadFromUrl(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
}

export default function HlrLookup() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [nums, setNums] = useState<string[]>([]);
  const [stats, setStats] = useState<{ totalFound: number; uniqueValid: number; duplicates: number }>({
    totalFound: 0,
    uniqueValid: 0,
    duplicates: 0,
  });

  // Pricing rule: 2 lookups cost 1 credit
  const LOOKUPS_PER_CREDIT = 2;
  // Charge is based on ALL found numbers in the uploaded file (not only unique)
  const estimatedCredits = Math.ceil(stats.totalFound / LOOKUPS_PER_CREDIT);
  const PRICE_PER_LOOKUP_USD = 0.06; // $0.06 per lookup (per number)
  const estimatedDollars = stats.totalFound * PRICE_PER_LOOKUP_USD;

  // UI no longer uses inline results; downloads via history/status
  const [results, setResults] = useState<HlrResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function fetchHistoryFromServer() {
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/hlr/list`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return;

      const items = (data.items || []) as any[];

      const normDate = (v: any) => {
        if (!v) return "";
        if (typeof v === "string") return v;
        if (typeof v === "object" && typeof v._seconds === "number") return new Date(v._seconds * 1000).toISOString();
        return String(v);
      };

      setHistory(
        items.map((it) => ({
          id: String(it.id),
          createdAt: normDate(it.createdAt),
          count: Number(it.count || 0),
          fileName: it.fileName ?? undefined,
          status: it.status ?? undefined,
          processed: typeof it.processed === "number" ? it.processed : undefined,
          total: typeof it.total === "number" ? it.total : undefined,
          rawTotal: typeof it.rawTotal === "number" ? it.rawTotal : undefined,
        }))
      );
    } catch (e) {
      console.warn("Could not fetch HLR history from server", e);
    }
  }

  useEffect(() => {
    void fetchHistoryFromServer();
  }, []);

  // Auto-refresh while running
  useEffect(() => {
    const hasRunning = history.some((h) => {
      const st = String(h.status || "").toLowerCase();
      return st === "queued" || st === "processing";
    });
    if (!hasRunning) return;
    const t = setInterval(() => {
      void fetchHistoryFromServer();
    }, 3000);
    return () => clearInterval(t);
  }, [history]);

  const counts = useMemo(
    () => ({
      active: results.filter((r) => r.status === "active").length,
      inactive: results.filter((r) => r.status === "inactive").length,
      unknown: results.filter((r) => r.status === "unknown").length,
      error: results.filter((r) => r.status === "error").length,
    }),
    [results]
  );

  async function onUpload(file: File) {
    setErr(null);
    setResults([]);
    setFileName(file.name);

    const text = await file.text();
    const s = extractNumbers(text);

    setNums(s.unique);
    setStats({ totalFound: s.totalFound, uniqueValid: s.uniqueValid, duplicates: s.duplicates });

    if (s.uniqueValid === 0) setErr("No valid numbers found in the CSV (need at least 8 digits).");
  }

  // ✅ THIS is the “punkt 4” fix: Save (uploads INPUT CSV) → Run (queues worker) → refresh history
  async function run() {
    setBusy(true);
    setErr(null);
    setResults([]);

    try {
      if (nums.length === 0) throw new Error("Please upload a CSV first.");
      if (!auth.currentUser) throw new Error("Please log in.");

      const lookupId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const token = await auth.currentUser.getIdToken();

      // 1) Save job + upload INPUT CSV for worker
      const resSave = await fetch("/api/hlr/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          lookupId,
          fileName,
          count: nums.length,
          rawTotal: stats.totalFound,
          createdAt,
          numbers: nums,
        }),
      });

      const dataSave = await safeJson(resSave);
      if (!resSave.ok) throw new Error((dataSave as any)?.error ?? "Failed to save HLR job");

      // 2) Queue job for VPS worker
      const resRun = await fetch("/api/hlr/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ lookupId }),
      });

      const dataRun = await safeJson(resRun);
      if (!resRun.ok) throw new Error((dataRun as any)?.error ?? "Failed to queue HLR job");

      void fetchHistoryFromServer();
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function downloadLookup(id: string) {
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();

      const resp = await fetch("/api/hlr/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ lookupId: id }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return;

      const url = data?.downloadUrl || data?.resultSignedUrl;
      if (url) downloadFromUrl(url);
    } catch (e) {
      console.warn("Download failed", e);
    }
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Why run HLR before a campaign?</CardTitle>
          <CardDescription>
            Running an HLR check helps you avoid wasted sends and improves campaign performance. CSV exports are stored for 7 days and then automatically deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-5 space-y-2 text-sm">
            <li>Reduce wasted credits: avoid sending to inactive or unreachable numbers.</li>
            <li>Improve deliverability: remove inactive/ported/blocked numbers before sending.</li>
            <li>Lower costs: fewer failed attempts and carrier rejections saves money.</li>
            <li>Cleaner reporting: campaign metrics reflect only valid targets.</li>
            <li>Compliance & reputation: healthier lists reduce filtering and protect sender reputation.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="w-full border-2 border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold">1 credit = 2 numbers</div>
            <div className="text-lg mt-1">1000 numbers = 500 credits</div>
            <div className="text-lg mt-1">Price per lookup: ${PRICE_PER_LOOKUP_USD.toFixed(2)} (per number)</div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold">Estimated: {estimatedCredits} credit{estimatedCredits !== 1 ? "s" : ""}</div>
            <div className="text-sm text-muted-foreground">≈ ${estimatedDollars.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) void onUpload(f);
          e.currentTarget.value = "";
        }}
      />

      <Card className="w-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>Upload a CSV file containing phone numbers. Numbers are auto-detected.</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => fileRef.current?.click()}>
              Choose CSV
            </Button>

            <Button onClick={run} disabled={busy || nums.length === 0}>
              {busy ? "Queueing..." : "Run HLR"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">File: {fileName ?? "-"}</Badge>
            <Badge variant="outline">Numbers found: {stats.totalFound}</Badge>
            <Badge variant="outline">Unique valid: {stats.uniqueValid}</Badge>
            <Badge variant="outline">Duplicates: {stats.duplicates}</Badge>
            <Badge variant="outline">Estimated cost (based on all numbers): {estimatedCredits} credit{estimatedCredits !== 1 ? "s" : ""} (1 credit / {LOOKUPS_PER_CREDIT} lookups)</Badge>
          </div>

          {err && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">
              <div className="font-medium">Error</div>
              <div className="text-muted-foreground">{err}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Last 20 Lookups</CardTitle>
          <CardDescription>Recent lookups from Firestore.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No history yet. Upload a CSV and run HLR.</div>
          ) : (
            history.slice(0, 20).map((h) => {
              const status = (h.status || "unknown").toLowerCase();
              const total = typeof h.total === "number" ? h.total : 0;
              const processed = typeof h.processed === "number" ? h.processed : 0;
              const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

              return (
                <div key={h.id} className="rounded-lg border bg-muted/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-medium">{h.fileName ?? "Lookup"}</div>
                            <div className="text-xs text-muted-foreground">
                              {h.createdAt} • {(h.rawTotal ?? h.count)} numbers • {h.count} unique
                              {status === "processing" || status === "queued" ? ` • ${processed}/${total}` : ""}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{Math.ceil(((h.rawTotal ?? h.total ?? h.count) || 0) / LOOKUPS_PER_CREDIT)} credit{Math.ceil(((h.rawTotal ?? h.total ?? h.count) || 0) / LOOKUPS_PER_CREDIT) !== 1 ? "s" : ""} (1 credit / {LOOKUPS_PER_CREDIT} lookups)</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void downloadLookup(h.id)}
                        disabled={status !== "completed"}
                      >
                        Download CSV
                      </Button>
                      <Badge variant="outline">{status}</Badge>
                    </div>
                  </div>

                  {(status === "processing" || status === "queued") && total > 0 && (
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{pct}%</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
