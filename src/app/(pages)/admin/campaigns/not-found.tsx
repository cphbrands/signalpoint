import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Campaign not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The campaign you tried to open does not exist (or you don’t have access).
      </p>
      <Link className="mt-4 inline-block underline" href="/admin/campaigns">
        Back to campaigns
      </Link>
    </div>
  );
}
