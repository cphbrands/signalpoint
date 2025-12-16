const GSM7_BASIC = new Set([
  "@","£","$","¥","è","é","ù","ì","ò","Ç","\n","Ø","ø","\r","Å","å",
  "Δ","_","Φ","Γ","Λ","Ω","Π","Ψ","Σ","Θ","Ξ"," ","!","\"","#","¤",
  "%","&","'","(",")","*","+",",","-",".","/","0","1","2","3","4","5","6","7","8","9",
  ":",";","<","=",">","?","¡","A","B","C","D","E","F","G","H","I","J","K","L","M","N",
  "O","P","Q","R","S","T","U","V","W","X","Y","Z","Ä","Ö","Ñ","Ü","§","¿","a","b",
  "c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v",
  "w","x","y","z","ä","ö","ñ","ü","à"
]);
const GSM7_EXT = new Set(["^","{","}","\\","[","~","]","|","€"]);

function analyzeSegments(msg) {
  if (!msg) return { encoding: "GSM-7", chars: 0, segments: 0 };
  let usesGsm7 = true;
  let septetCount = 0;
  for (const ch of Array.from(msg)) {
    if (GSM7_BASIC.has(ch)) {
      septetCount += 1;
    } else if (GSM7_EXT.has(ch)) {
      septetCount += 2;
    } else {
      usesGsm7 = false;
      break;
    }
  }
  if (usesGsm7) {
    const singleLimit = 160;
    const multiLimit = 153;
    const chars = septetCount;
    const segments = chars === 0 ? 0 : chars <= singleLimit ? 1 : Math.ceil(chars / multiLimit);
    return { encoding: "GSM-7", chars, segments };
  }
  const codePoints = Array.from(msg).length;
  const singleLimit = 70;
  const multiLimit = 67;
  const segments = codePoints === 0 ? 0 : codePoints <= singleLimit ? 1 : Math.ceil(codePoints / multiLimit);
  return { encoding: "UCS-2", chars: codePoints, segments };
}

console.log('hello ->', analyzeSegments('hello world'));
console.log('danish ->', analyzeSegments('Hej med æøå'));
console.log('emoji ->', analyzeSegments('Emoji 😊😊😊'));
