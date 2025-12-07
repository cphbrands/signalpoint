const fs = require("fs");

const FILE = "src/app/(pages)/dashboard/campaigns/page.tsx";
let s = fs.readFileSync(FILE, "utf8");

// 1) Make query simple: only where(userId == user.uid). Avoid orderBy that can require composite index.
s = s.replace(
  /const\s+q\s*=\s*query\([\s\S]*?\);\s*/m,
  `const q = query(
          collection(db, "campaigns"),
          where("userId", "==", user.uid)
        );\n`
);

// 2) Ensure onSnapshot has error handler and always stops loading.
// Replace: onSnapshot(q, (snapshot) => { ... });  => onSnapshot(q, (snapshot)=>{ try{...}finally{setLoading(false)} }, (err)=>{...})
// We do a conservative patch around first onSnapshot(q, (snapshot) => { ... });
const re = /onSnapshot\(\s*q\s*,\s*\(snapshot\)\s*=>\s*\{\s*([\s\S]*?)\s*\}\s*\)\s*;?/m;

if (re.test(s)) {
  s = s.replace(re, (m, inner) => {
    return `onSnapshot(
          q,
          (snapshot) => {
            try {
${inner}
            } catch (e) {
              console.error("[Campaigns] onSnapshot render/map error:", e);
            } finally {
              setLoading(false);
            }
          },
          (err) => {
            console.error("[Campaigns] onSnapshot error:", err);
            setLoading(false);
          }
        );`;
  });
} else {
  // If pattern differs, just ensure there's an error callback somewhere (manual fallback)
  console.log("⚠️ Could not auto-patch onSnapshot block (pattern mismatch).");
}

// 3) If you sort in UI, do it client-side (safe)
if (!s.includes("data.sort") && s.includes("setCampaigns(data)")) {
  s = s.replace(
    /setCampaigns\(data\);/g,
    `data.sort((a:any,b:any)=> (b.createdAt?.toDate?.()?.getTime?.() || 0) - (a.createdAt?.toDate?.()?.getTime?.() || 0));
            setCampaigns(data);`
  );
}

// backup + write
fs.writeFileSync(FILE + `.bak.${Date.now()}`, fs.readFileSync(FILE, "utf8"), "utf8");
fs.writeFileSync(FILE, s, "utf8");
console.log("✅ Patched:", FILE);
