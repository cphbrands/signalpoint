const fs = require("fs");

const FILE = "src/app/(pages)/dashboard/campaigns/page.tsx";
let s = fs.readFileSync(FILE, "utf8");
let changed = false;

s = s.replace(
  /(<TableHeader>[\s\S]*?<TableRow[\s\S]*?)(<\/TableRow>)/m,
  (full, a, b) => {
    if (full.includes(">DLR<") || full.includes("Download DLR CSV") || full.includes("dlrExportUrl")) return full;
    changed = true;
    return a + `\n            <TableHead>DLR</TableHead>\n          ` + b;
  }
);

const bodyStart = s.indexOf("<TableBody");
const bodyEnd = s.indexOf("</TableBody>", bodyStart);
if (bodyStart < 0 || bodyEnd < 0) {
  console.error("❌ Could not find <TableBody> in:", FILE);
  process.exit(1);
}
const bodyCloseLen = "</TableBody>".length;
let bodyBlock = s.slice(bodyStart, bodyEnd + bodyCloseLen);

let rowVar = null;
let mm =
  bodyBlock.match(/\.map\(\(\s*([A-Za-z_]\w*)\s*\)\s*=>[\s\S]*?<TableRow/) ||
  bodyBlock.match(/\.map\(\s*([A-Za-z_]\w*)\s*=>[\s\S]*?<TableRow/);

if (mm) rowVar = mm[1];
if (!rowVar) {
  console.error("❌ Could not find a .map(... => <TableRow ...) inside <TableBody> in:", FILE);
  process.exit(1);
}

if (!bodyBlock.includes("dlrExportUrl")) {
  const cell = `
            <TableCell>
              ${rowVar}.dlrExportUrl ? (
                <a
                  href={${rowVar}.dlrExportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-sm"
                >
                  Download DLR CSV
                </a>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </TableCell>
`;

  let pos = bodyBlock.indexOf("<TableRow");
  let inserted = false;

  while (pos >= 0) {
    const endRow = bodyBlock.indexOf("</TableRow>", pos);
    if (endRow < 0) break;

    const rowChunk = bodyBlock.slice(pos, endRow);
    if (rowChunk.includes(`${rowVar}.`)) {
      bodyBlock = bodyBlock.slice(0, endRow) + cell + bodyBlock.slice(endRow);
      inserted = true;
      changed = true;
      break;
    }
    pos = bodyBlock.indexOf("<TableRow", endRow + 1);
  }

  if (!inserted) {
    console.error("❌ Found map var =", rowVar, "but could not insert into a matching <TableRow>.");
    process.exit(1);
  }
}

if (!changed) {
  console.log("ℹ️ No changes needed (DLR link already present).");
  process.exit(0);
}

fs.writeFileSync(FILE + `.bak.${Date.now()}`, s, "utf8");
s = s.slice(0, bodyStart) + bodyBlock + s.slice(bodyEnd + bodyCloseLen);
fs.writeFileSync(FILE, s, "utf8");

console.log("✅ Patched campaigns page with DLR link. rowVar =", rowVar);
console.log("   File:", FILE);
