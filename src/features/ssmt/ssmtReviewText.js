// Presentation-only recovery of recognizable words from legacy replacement characters.
// Never apply this to identities/MRNs or write the result automatically to shared data.
export function reviewText(value) {
 return String(value ?? "")
 .replace(/jalape\uFFFD(?=os?\b)/gi, "jalape\u00f1")
 .replace(/saut\uFFFD(?=ed?\b)/gi, "saut\u00e9")
 .replace(/pur\uFFFD(?=e(?:d)?\b)/gi, "pur\u00e9")
 .replace(/gruy\uFFFDre/gi, "gruy\u00e8re")
 .replace(/consomm\uFFFD/gi, "consomm\u00e9")
 .replace(/b\uFFFDchamel/gi, "b\u00e9chamel")
 .replace(/cr\uFFFDpe/gi, "cr\u00eape")
 .replace(/entr\uFFFDe/gi, "entr\u00e9e")
 .replace(/\uFFFD/g, "[text needs correction]");
}
