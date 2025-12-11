import AdminDashboardLayout from "@/components/admin/layout/admin-layout";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

function normDate(v: any) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object" && typeof v._seconds === "number") return new Date(v._seconds * 1000).toISOString();
    try {
        return new Date(String(v)).toISOString();
    } catch {
        return String(v);
    }
}

export default async function AdminHlrPage() {
    // Fetch recent lookups (server-side) and enrich with user email + signed download URL
    const snap = await adminDb.collection("hlrLookups").orderBy("createdAtTs", "desc").limit(200).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    const uids = Array.from(new Set(docs.map((d) => d.userId).filter(Boolean)));
    const uidToEmail: Record<string, string | null> = {};
    await Promise.all(
        uids.map(async (uid) => {
            try {
                const u = await adminAuth.getUser(uid);
                uidToEmail[uid] = u.email || null;
            } catch (e) {
                uidToEmail[uid] = null;
            }
        })
    );

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || admin.apps?.[0]?.options?.storageBucket;
    const bucket = bucketName ? admin.storage().bucket(bucketName) : null;

    const items = await Promise.all(
        docs.map(async (doc) => {
            let downloadUrl: string | null = null;
            try {
                const path = doc.resultStoragePath || doc.storagePath || null;
                if (bucket && path) {
                    const file = bucket.file(path);
                    const [url] = await file.getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
                    downloadUrl = url;
                }
            } catch (e) {
                // ignore signed url errors
            }
            return {
                id: doc.id,
                fileName: doc.fileName || null,
                createdAt: normDate(doc.createdAt),
                count: Number(doc.count || 0),
                total: typeof doc.total === "number" ? doc.total : undefined,
                rawTotal: typeof doc.rawTotal === "number" ? doc.rawTotal : undefined,
                status: doc.status || null,
                processed: typeof doc.processed === "number" ? doc.processed : undefined,
                userId: doc.userId || null,
                userEmail: doc.userId ? uidToEmail[doc.userId] || null : null,
                downloadUrl,
            };
        })
    );

    return (
        <AdminDashboardLayout>
            <div className="container mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold mb-4">HLR Lookups (All users)</h1>

                <div>
                    <h2 className="text-lg font-medium mb-2">Recent lookups (read-only)</h2>
                    <div className="space-y-3">
                        {items.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No lookups found.</div>
                        ) : (
                            items.map((it) => (
                                <div key={it.id} className="rounded-lg border bg-muted/10 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="text-sm">
                                            <div className="font-medium">{it.fileName ?? "Lookup"}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {it.createdAt} • {it.rawTotal ?? it.count} numbers • {it.count} unique
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">User: {it.userEmail ?? it.userId ?? "-"}</div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {it.downloadUrl ? (
                                                <a href={it.downloadUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                                                    Download CSV
                                                </a>
                                            ) : (
                                                <div className="text-sm text-muted-foreground">No result</div>
                                            )}
                                            <div className="text-xs">
                                                <span className="inline-block rounded-md border px-2 py-1 text-xs">{it.status ?? "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
