const fs = require("fs");

const FILES = [
  "src/app/(pages)/dashboard/campaigns/page.tsx",
  "src/components/dashboard/overview/recent-campaigns.tsx",
  "src/app/(pages)/dashboard/page.tsx",
];

function patchInterfaceCampaign(src) {
  if (src.includes("dlrExportUrl")) return { src, changed: false };

  const idx = src.indexOf("interface Campaign");
  if (idx < 0) return { src, changed: false };

  // find the closing "}" of the interface (first one after idx)
  const end = src.indexOf("\n}", idx);
  if (end < 0) return { src, changed: false };

  const insert =
`\n  // DLR export\n  dlrExportUrl?: string | null;\n  dlrDone?: boolean;\n`;

  const out = src.slice(0, end) + insert + src.slice(end);
  return { src: out, changed: true };
}

function patchSnapshotMapReturn(src) {
  if (src.includes("dlrExportUrl:")) return { src, changed: false };

  const mapIdx = src.indexOf("snapshot.docs.map");
  if (mapIdx < 0) return { src, changed: false };

  // look for "return {" after mapIdx
  const retIdx = src.indexOf("return {", mapIdx);
  if (retIdx < 0) return { src, changed: false };

  // find the end of that return object: the first "\n    }" or "\n  }" followed by ";" after retIdx
  // We'll search for "};" after retIdx, which is common in your code.
  const closeIdx = src.indexOf("};", retIdx);
  if (closeIdx < 0) return { src, changed: false };

  const insert =
`\n            // DLR export\n            dlrExportUrl: (data as any).dlrExportUrl ?? null,\n            dlrDone: (data as any).dlrDone ?? false,\n`;

  const out = src.slice(0, closeIdx) + insert + src.slice(closeIdx);
  return { src: out, changed: true };
}

let anyChanged = false;

for (const file of FILES) {
  if (!fs.existsSync(file)) {
    console.log("↪ skip (not found):", file);
    continue;
  }

  const before = fs.readFileSync(file, "utf8");
  let src = before;

  const a = patchInterfaceCampaign(src);
  src = a.src;

  const b = patchSnapshotMapReturn(src);
  src = b.src;

  const changed = (src !== before);
  if (changed) {
    fs.writeFileSync(file + `.bak.${Date.now()}`, before, "utf8");
    fs.writeFileSync(file, src, "utf8");
    console.log("✅ patched:", file);
    anyChanged = true;
  } else {
    console.log("ℹ️ no change needed:", file);
  }
}

if (!anyChanged) {
  console.log("⚠️ No files changed. If your snapshot mapping differs, paste the file and I’ll patch exact lines.");
}
