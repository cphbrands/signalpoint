"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type HlrResult = {
  number: string;
  status: "ok" | "error";
  country?: string;
  network?: string;
  mccmnc?: string;
  message?: string;
};

function parseNumbers(raw: string) {
  const parts = raw
    .split(/[\s,;\n\r\t]+/g)
    .map((x) => x.trim())
    .filter(Boolean);

  const cleaned = parts.map((n) => n.replace(/[^\d]/g, ""));
  const valid = cleaned.filter((n) => n.length >= 8);
  const invalid = cleaned.length - valid.length;

  const seen = new Set<string>();
  const unique: string[] = [];
  let dup = 0;

  for (const n of valid) {
    if (seen.has(n)) dup += 1;
    else {
      seen.add(n);
      unique.push(n);
    }
  }

  return { parsed: parts.length, invalid, duplicates: dup, uniqueValid: unique.length, unique };
}

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  const text = await res.text();
  return { error: text.slice(0, 300) };
}

export default function HlrPage() {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<HlrResult[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const stats = useMemo(() => parseNumbers(raw), [raw]);

  async function run() {
    setBusy(true);
    setErr(null);
    setResults([]);
    try {
      const res = await fetch("/api/hlr/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: stats.unique }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error ?? "HLR failed");

      setResults(data?.results ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function refreshHistory() {
    setErr(null);
    try {
      const res = await fetch("/api/hlr/history", { method: "GET" });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error ?? "History fetch failed");
      setHistory(data?.history ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">HLR Lookup</h1>
          <p className="text-muted-foreground">Mock lookup (ingen rigtig provider endnu).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refreshHistory}>Refresh History</Button>
          <Button onClick={run} disabled={busy || stats.uniqueValid === 0}>
            {busy ? "Running..." : "Run HLR"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Numbers</CardTitle>
          <CardDescription>Én pr linje eller adskilt med mellemrum/komma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"4530270096\n4540500657"}
            className="min-h-[160px]"
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Parsed: {stats.parsed}</Badge>
            <Badge variant="outline">Unique valid: {stats.uniqueValid}</Badge>
            <Badge variant="outline">Invalid: {stats.invalid}</Badge>
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

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Seneste mock-svar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.length === 0 ? (
            <div className="text-sm text-muted-foreground">Ingen resultater endnu.</div>
          ) : (
            results.map((r) => (
              <div key={r.number} className="flex items-center justify-between rounded-lg border bg-muted/10 p-3">
                <div className="space-y-1">
                  <div className="font-medium">{r.number}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.country ?? "-"} • {r.network ?? "-"} • {r.mccmnc ?? "-"}
                  </div>
                </div>
                <Badge variant={r.status === "ok" ? "default" : "destructive"}>{r.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last 20 lookups</CardTitle>
          <CardDescription>Mock historik (tom indtil du gemmer det i DB).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No history yet. Klik “Refresh History”.</div>
          ) : (
            history.slice(0, 20).map((h, i) => (
              <div key={h.id ?? i} className="flex items-center justify-between rounded-lg border bg-muted/10 p-3">
                <div className="text-sm">
                  <div className="font-medium">{h.title ?? `Lookup #${i + 1}`}</div>
                  <div className="text-xs text-muted-foreground">{h.createdAt ?? ""} • {h.count ?? "-"} numre</div>
                </div>
                <Badge variant="outline">{h.status ?? "done"}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
