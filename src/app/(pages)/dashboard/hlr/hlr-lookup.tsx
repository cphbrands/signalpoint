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

type HistoryItem = { id: string; createdAt: string; count: number; fileName?: string };
const HISTORY_KEY = "hlr_history_v1";

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

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

function csvKeyFor(id: string) {
  return `hlr_csv_${id}`;
}

function toCsv(rows: HlrResult[]) {
  const header = ["number","status","country","network","mccmnc","ported","note"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g,'""')}"`;
  return [
    header.join(","),
    ...rows.map(r => [
      esc(r.number), esc(r.status), esc(r.country), esc(r.network), esc(r.mccmnc),
      esc(r.ported ? "yes" : "no"), esc(r.note),
    ].join(",")),
  ].join("\n");
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
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
  const [results, setResults] = useState<HlrResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  // fetch server-side history from Firestore for logged in user
  async function fetchHistoryFromServer() {
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/hlr/list`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) setHistory(data.items || []);
    } catch (e) {
      console.warn("Could not fetch HLR history from server", e);
    }
  }

  useEffect(() => {
    void fetchHistoryFromServer();
  }, []);

  const counts = useMemo(() => ({
    active: results.filter(r => r.status === "active").length,
    inactive: results.filter(r => r.status === "inactive").length,
    unknown: results.filter(r => r.status === "unknown").length,
    error: results.filter(r => r.status === "error").length,
  }), [results]);

  async function onUpload(file: File) {
    setErr(null);
    setResults([]);
    setFileName(file.name);

    const text = await file.text();
    const s = extractNumbers(text);

    setNums(s.unique);
    setStats({ totalFound: s.totalFound, uniqueValid: s.uniqueValid, duplicates: s.duplicates });

    if (s.uniqueValid === 0) {
      setErr("No valid numbers found in the CSV (need at least 8 digits).");
    }
  }

  async function run() {
    setBusy(true); setErr(null); setResults([]);
    try {
      if (nums.length === 0) throw new Error("Please upload a CSV first.");

      const res = await fetch("/api/hlr/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: nums }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any)?.error ?? "HLR failed");

      const out: HlrResult[] = (data as any)?.results ?? [];
      setResults(out);

      const item: HistoryItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        count: nums.length,
        fileName: fileName ?? undefined,
      };
      const next = [item, ...loadHistory()];
      saveHistory(next);
      setHistory(next.slice(0, 20));

      // try saving to Firestore via server endpoint
      try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        if (token) {
          await fetch("/api/hlr/save", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lookupId: item.id, fileName: item.fileName, count: item.count, createdAt: item.createdAt, results: out }),
          });
          // refresh server history
          void fetchHistoryFromServer();
        }
      } catch (e) {
        console.warn("Failed to save HLR results to server", e);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    setFileName(null);
    setNums([]);
    setStats({ totalFound: 0, uniqueValid: 0, duplicates: 0 });
    setResults([]);
    setErr(null);
    // remove local history and ask server for refreshed state
    try {
      saveHistory([]);
      setHistory([]);
      void fetchHistoryFromServer();
    } catch {}
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Why run HLR before a campaign?</CardTitle>
          <CardDescription>Running an HLR check helps you avoid wasted sends and improves campaign performance. CSV exports are stored for 7 days and then automatically deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-5 space-y-2 text-sm">
            <li>Reduce wasted credits: avoid sending to inactive or unreachable numbers.</li>
            <li>Improve deliverability: remove numbers that are inactive, ported or blocked before sending.</li>
            <li>Lower costs: fewer failed attempts and carrier rejections saves money.</li>
            <li>Cleaner reporting: campaign metrics reflect only valid targets.</li>
            <li>Compliance & reputation: keep sending lists healthy to reduce carrier filtering and protect sender reputation.</li>
          </ul>
        </CardContent>
      </Card>
      {/* Hidden-but-clickable input (sr-only is safer than hidden) */}
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
              {busy ? "Running..." : "Run HLR"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">File: {fileName ?? "-"}</Badge>
            <Badge variant="outline">Numbers found: {stats.totalFound}</Badge>
            <Badge variant="outline">Unique valid: {stats.uniqueValid}</Badge>
            <Badge variant="outline">Duplicates: {stats.duplicates}</Badge>
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
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Results</CardTitle>
            <CardDescription>Results are not shown here for privacy — export a CSV to view them.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="secondary"
              onClick={() => download(`hlr-results-${Date.now()}.csv`, toCsv(results), "text/csv;charset=utf-8")}
              disabled={results.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Results are only available via CSV export. Use the "Export CSV" button when a run completes.</div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Last 20 Lookups</CardTitle>
          <CardDescription>Stored locally in your browser (localStorage).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">No history yet. Upload a CSV and run HLR.</div>
            ) : (
              history.slice(0, 20).map((h) => {
                return (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border bg-muted/10 p-3">
                    <div className="text-sm">
                      <div className="font-medium">{h.fileName ?? "Lookup"}</div>
                      <div className="text-xs text-muted-foreground">{h.createdAt} • {h.count} numbers</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            if (!auth.currentUser) return;
                            const token = await auth.currentUser.getIdToken();
                            const resp = await fetch("/api/hlr/status", {
                              method: "POST",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ lookupId: h.id }),
                            });
                            if (!resp.ok) return;
                            const data = await resp.json();
                            // If server returned a signed download URL (for large exports), use it
                            if (data?.downloadUrl) {
                              const a = document.createElement("a");
                              a.href = data.downloadUrl;
                              a.target = "_blank";
                              a.rel = "noopener noreferrer";
                              a.click();
                              return;
                            }
                            const rows = (data?.results || []) as HlrResult[];
                            const csv = toCsv(rows);
                            download(`hlr-${h.fileName ?? h.id}-${Date.parse(h.createdAt)}.csv`, csv, "text/csv;charset=utf-8");
                          } catch (e) {
                            console.warn("Failed to download CSV from server", e);
                          }
                        }}
                      >
                        Download CSV
                      </Button>
                      <Badge variant="outline">done</Badge>
                    </div>
                  </div>
                );
              })
            )}
        </CardContent>
      </Card>
    </div>
  );
}
