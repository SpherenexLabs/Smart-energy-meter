// src/utils/customerId.js
export function makeCustomerId(uid){
  // One-time, readable ID: BES + YYMM + 6 of uid + 3 random
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth()+1).padStart(2,"0");
  const base = (uid || "XXXXXX").replace(/[^A-Za-z0-9]/g,"").slice(0,6).toUpperCase();
  const rand = Math.floor(Math.random()*1000).toString().padStart(3,"0");
  return `BES${y}${m}-${base}-${rand}`;
}
