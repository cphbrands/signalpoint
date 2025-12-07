const fs = require("fs");

const FILE = "src/app/(pages)/dashboard/campaigns/page.tsx";
if (!fs.existsSync(FILE)) {
  console.error("File not found:", FILE);
  process.exit(1);
}

let s = fs.readFileSync(FILE, "utf8");
const orig = s;

// 1) Remove the WRONG inserted lines (those using data as any) that ended up inside the interface
s = s.replace(/^\s*dlrExportUrl:\s*\(data as any\)\.dlrExportUrl.*$/gm, "");
s = s.replace(/^\s*dlrDone:\s*Boolean\(\(data as any\)\.dlrDone\).*$/gm, "");

// 2) Fix a broken "status:" line inside interface (if it became just "status:")
s = s.replace(/^\s*status:\s*$/m, '  status: "completed" | "scheduled" | "failed";');

// 3) Ensure interface Campaign includes optional DLR fields
const i0 = s.indexOf("interface Campaign");
if (i0 >= 0) {
  const iEnd = s.indexOf("\n}", i0);
  if (iEnd > i0) {
    const block = s.slice(i0, iEnd);
    if (!block.includes("dlrExportUrl?:")) {
      const insert = `\n  // DLR export\n  dlrExportUrl?: string | null;\n  dlrDone?: boolean;\n`;
      s = s.slice(0, iEnd) + insert + s.slice(iEnd);
    }
  }
}

// 4) Add dlrExportUrl/dlrDone to snapshot mapping return object (only if not already there)
if (!s.includes("dlrExportUrl: (data as any).dlrExportUrl")) {
  const mapIdx = s.indexOf("snapshot.docs.map");
  if (mapIdx >= 0) {
    const retIdx = s.indexOf("return {", mapIdx);
    if (retIdx >= 0) {
      const injectAt = retIdx + "return {".length;
      const insert =
`\n            // DLR export\n            dlrExportUrl: (data as any).dlrExportUrl ?? null,\n            dlrDone: (data as any).dlrDone ?? false,`;
      s = s.slice(0, injectAt) + insert + s.slice(injectAt);
    }
  }
}

if (s === orig) {
  console.log("ℹ️ No changes needed.");
  process.exit(0);
}

fs.writeFileSync(FILE + `.bak.${Date.now()}`, orig, "utf8");
fs.writeFileSync(FILE, s, "utf8");
console.log("✅ Fixed DLR mapping/build issue in:", FILE);
