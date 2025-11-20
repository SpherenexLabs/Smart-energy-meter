// // src/plans/Prepaid.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import "./shared.css";
// import { ref, set, push, serverTimestamp, update } from "firebase/database";

// /**
//  * Prepaid
//  * - Select start (Now or time today) + duration (minutes)
//  * - Shows amount (1 min = ₹10)
//  * - Simulates payment (10s), then starts session
//  * - Sets Logging/Relay to "1" at start, "0" at end
//  * - Shows countdown + progress, with 3-min warning
//  */
// export default function Prepaid({ user, db, lockSession, onComplete }) {
//   const [startMode, setStartMode] = useState("now"); // "now" | "time"
//   const [timeToday, setTimeToday] = useState(() => new Date().toISOString().slice(11,16)); // HH:MM
//   const [minutes, setMinutes] = useState(10);
//   const [phase, setPhase] = useState("idle");        // "idle" | "paying" | "scheduled" | "running" | "done"
//   const [warnOpen, setWarnOpen] = useState(false);
//   const [statusText, setStatusText] = useState("");

//   const totalMs = useMemo(()=>Math.max(1, Number(minutes)) * 60 * 1000, [minutes]);
//   const [remainingMs, setRemainingMs] = useState(totalMs);
//   const intervalRef = useRef(null);
//   const sessionRef = useRef(null); // db key path for session log

//   useEffect(()=>{ setRemainingMs(totalMs); },[totalMs]);

//   const amount = (Number(minutes) || 0) * 10;

//   const startSession = async (startAt) => {
//     // Log session
//     const sessionsPath = ref(db, `Logging/users/${user.uid}/sessions`);
//     const newRef = push(sessionsPath);
//     sessionRef.current = newRef;
//     await set(newRef, {
//       type: "prepaid",
//       state: "scheduled",
//       startAt: startAt ?? serverTimestamp(),
//       minutes: Number(minutes),
//       amount,
//       createdAt: serverTimestamp()
//     });

//     if (startAt && startAt > Date.now()) {
//       setPhase("scheduled");
//       setStatusText(`Scheduled for ${new Date(startAt).toLocaleTimeString()}`);
//       // Poll until start time
//       const delay = startAt - Date.now();
//       setTimeout(()=> doStartRun(), delay);
//     } else {
//       doStartRun();
//     }
//   };

//   const doStartRun = async ()=>{
//     lockSession?.();
//     await update(sessionRef.current, { state: "running", realStart: serverTimestamp() });
//     // Relay ON
//     await set(ref(db, "Logging/Relay"), "1");
//     setPhase("running");
//     setStatusText("Power ON. Session started.");

//     const t0 = Date.now();
//     clearInterval(intervalRef.current);
//     intervalRef.current = setInterval(()=>{
//       const elapsed = Date.now() - t0;
//       const left = Math.max(0, totalMs - elapsed);
//       setRemainingMs(left);
//       // 3-minute warning
//       if (left <= 3*60*1000 && left > 0 && !warnOpen) setWarnOpen(true);
//       if (left <= 0) {
//         clearInterval(intervalRef.current);
//         finishSession();
//       }
//     }, 1000);
//   };

//   const finishSession = async ()=>{
//     // Relay OFF
//     await set(ref(db, "Logging/Relay"), "0");
//     await update(sessionRef.current, { state: "completed", finishedAt: serverTimestamp() });
//     setPhase("done");
//     setStatusText("Session completed.");
//     onComplete?.("Your selected duration is completed. Thanks for using.");
//   };

//   const handlePayment = async (e)=>{
//     e.preventDefault();
//     if (!user) return;
//     setPhase("paying");
//     setStatusText("Initializing payment...");
//     // Simulate payment 10s
//     setTimeout(async ()=>{
//       setStatusText("Payment completed.");
//       // Resolve start time
//       let startAt = Date.now();
//       if (startMode === "time") {
//         const now = new Date();
//         const [hh, mm] = timeToday.split(":").map(Number);
//         const sched = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
//         startAt = sched.getTime();
//       }
//       await startSession(startAt);
//     }, 10000);
//   };

//   const pct = Math.max(0, Math.min(100, 100 - (remainingMs/totalMs)*100));

//   return (
//     <div className="plan-body">
//       <div className="plan-grid">
//         <form className="plan-form card" onSubmit={handlePayment}>
//           <h4>Prepaid</h4>

//           <div className="field-row">
//             <label className="label">Start</label>
//             <div className="chip-row">
//               <button type="button" className={`chip ${startMode==='now'?'active':''}`} onClick={()=>setStartMode('now')} disabled={phase!=='idle'}>Start Now</button>
//               <button type="button" className={`chip ${startMode==='time'?'active':''}`} onClick={()=>setStartMode('time')} disabled={phase!=='idle'}>Pick Time (Today)</button>
//             </div>
//           </div>

//           {startMode==='time' && (
//             <div className="field-row">
//               <label className="label">Time (Today)</label>
//               <input type="time" className="input" value={timeToday} onChange={e=>setTimeToday(e.target.value)} disabled={phase!=='idle'}/>
//             </div>
//           )}

//           <div className="field-row">
//             <label className="label">Duration (minutes)</label>
//             <input type="number" className="input" min="1" value={minutes} onChange={e=>setMinutes(e.target.value)} disabled={phase!=='idle'}/>
//           </div>

//           <div className="amount-row">
//             <span>Amount</span>
//             <strong>₹ {amount}</strong>
//             <span className="muted">(1 min = ₹10)</span>
//           </div>

//           <button className="primary-btn" disabled={phase!=='idle'}>
//             Complete Payment
//           </button>

//           {phase!=='idle' && (
//             <p className="muted small mt">{statusText}</p>
//           )}
//         </form>

//         <div className="plan-visual card">
//           <h4>Status</h4>
//           {phase === "scheduled" && (
//             <div className="status-box info">Session scheduled. Waiting to start…</div>
//           )}
//           {phase === "paying" && (
//             <div className="status-box warn">Initializing payment… (~10s)</div>
//           )}
//           {(phase === "running" || phase === "done") && (
//             <>
//               <div className="progress-wrap">
//                 <div className="progress">
//                   <div className="progress-bar" style={{width: `${pct}%`}} />
//                 </div>
//                 <div className="progress-caption">
//                   <span>Elapsed: {Math.round((totalMs-remainingMs)/1000)}s</span>
//                   <span>Remaining: {Math.ceil(remainingMs/1000)}s</span>
//                 </div>
//               </div>

//               {warnOpen && remainingMs > 0 && (
//                 <div className="alert">
//                   <div className="alert-title">Only 3 minutes left</div>
//                   <button className="alert-close" onClick={()=>setWarnOpen(false)} aria-label="Dismiss">✕</button>
//                 </div>
//               )}
//             </>
//           )}
//           {phase==="idle" && <div className="status-box">Awaiting details…</div>}
//         </div>
//       </div>
//     </div>
//   );
// }





// src/plans/Prepaid.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./shared.css";
import { ref, set, push, serverTimestamp, update } from "firebase/database";

/**
 * Prepaid
 * - Select start (Now or time today) + duration (minutes)
 * - Amount: 1 min = ₹10
 * - Simulates payment (10s), then starts session
 * - Sets Logging/Relay to "1" at start, "0" at end
 * - Writes computed amount to Logging/Balance after payment
 */
export default function Prepaid({ user, db, lockSession, onComplete }) {
  const [startMode, setStartMode] = useState("now"); // "now" | "time"
  const [timeToday, setTimeToday] = useState(() =>
    new Date().toISOString().slice(11, 16)
  ); // HH:MM
  const [minutes, setMinutes] = useState(10);
  const [phase, setPhase] = useState("idle"); // "idle" | "paying" | "scheduled" | "running" | "done"
  const [warnOpen, setWarnOpen] = useState(false);
  const [statusText, setStatusText] = useState("");

  const totalMs = useMemo(
    () => Math.max(1, Number(minutes)) * 60 * 1000,
    [minutes]
  );
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const intervalRef = useRef(null);
  const sessionRef = useRef(null); // db key path for session log

  useEffect(() => {
    setRemainingMs(totalMs);
  }, [totalMs]);

  const amount = (Number(minutes) || 0) * 10; // ₹

  const startSession = async (startAt) => {
    const sessionsPath = ref(db, `Logging/users/${user.uid}/sessions`);
    const newRef = push(sessionsPath);
    sessionRef.current = newRef;
    await set(newRef, {
      type: "prepaid",
      state: "scheduled",
      startAt: startAt ?? serverTimestamp(),
      minutes: Number(minutes),
      amount,
      createdAt: serverTimestamp(),
    });

    if (startAt && startAt > Date.now()) {
      setPhase("scheduled");
      setStatusText(`Scheduled for ${new Date(startAt).toLocaleTimeString()}`);
      setTimeout(() => doStartRun(), startAt - Date.now());
    } else {
      doStartRun();
    }
  };

  const doStartRun = async () => {
    lockSession?.();
    await update(sessionRef.current, {
      state: "running",
      realStart: serverTimestamp(),
    });
    // Relay ON
    await set(ref(db, "Logging/Relay"), "1");
    setPhase("running");
    setStatusText("Power ON. Session started.");

    const t0 = Date.now();
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - t0;
      const left = Math.max(0, totalMs - elapsed);
      setRemainingMs(left);
      if (left <= 3 * 60 * 1000 && left > 0 && !warnOpen) setWarnOpen(true);
      if (left <= 0) {
        clearInterval(intervalRef.current);
        finishSession();
      }
    }, 1000);
  };

  const finishSession = async () => {
    // Relay OFF
    await set(ref(db, "Logging/Relay"), "0");
    await update(sessionRef.current, {
      state: "completed",
      finishedAt: serverTimestamp(),
    });
    setPhase("done");
    setStatusText("Session completed.");
    onComplete?.("Your selected duration is completed. Thanks for using.");
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!user) return;
    setPhase("paying");
    setStatusText("Initializing payment...");
    // Simulate payment 10s
    setTimeout(async () => {
      setStatusText("Payment completed.");
      // ✅ ALSO update Balance with the same amount (as string to match your DB)
      await set(ref(db, "Logging/Balance"), String(amount));

      // Resolve start time
      let startAt = Date.now();
      if (startMode === "time") {
        const now = new Date();
        const [hh, mm] = timeToday.split(":").map(Number);
        const sched = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hh,
          mm,
          0,
          0
        );
        startAt = sched.getTime();
      }
      await startSession(startAt);
    }, 10000);
  };

  const pct = Math.max(0, Math.min(100, 100 - (remainingMs / totalMs) * 100));

  return (
    <div className="plan-body">
      <div className="plan-grid">
        <form className="plan-form card" onSubmit={handlePayment}>
          <h4>Prepaid</h4>

          <div className="field-row">
            <label className="label">Start</label>
            <div className="chip-row">
              <button
                type="button"
                className={`chip ${startMode === "now" ? "active" : ""}`}
                onClick={() => setStartMode("now")}
                disabled={phase !== "idle"}
              >
                Start Now
              </button>
              <button
                type="button"
                className={`chip ${startMode === "time" ? "active" : ""}`}
                onClick={() => setStartMode("time")}
                disabled={phase !== "idle"}
              >
                Pick Time (Today)
              </button>
            </div>
          </div>

          {startMode === "time" && (
            <div className="field-row">
              <label className="label">Time (Today)</label>
              <input
                type="time"
                className="input"
                value={timeToday}
                onChange={(e) => setTimeToday(e.target.value)}
                disabled={phase !== "idle"}
              />
            </div>
          )}

          <div className="field-row">
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              className="input"
              min="1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              disabled={phase !== "idle"}
            />
          </div>

          <div className="amount-row">
            <span>Amount</span>
            <strong>₹ {amount}</strong>
            <span className="muted">(1 min = ₹10)</span>
          </div>

          <button className="primary-btn" disabled={phase !== "idle"}>
            Complete Payment
          </button>

          {phase !== "idle" && <p className="muted small mt">{statusText}</p>}
        </form>

        <div className="plan-visual card">
          <h4>Status</h4>
          {phase === "scheduled" && (
            <div className="status-box info">
              Session scheduled. Waiting to start…
            </div>
          )}
          {phase === "paying" && (
            <div className="status-box warn">
              Initializing payment… (~10s)
            </div>
          )}
          {(phase === "running" || phase === "done") && (
            <>
              <div className="progress-wrap">
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="progress-caption">
                  <span>
                    Elapsed: {Math.round((totalMs - remainingMs) / 1000)}s
                  </span>
                  <span>Remaining: {Math.ceil(remainingMs / 1000)}s</span>
                </div>
              </div>

              {warnOpen && remainingMs > 0 && (
                <div className="alert">
                  <div className="alert-title">Only 3 minutes left</div>
                  <button
                    className="alert-close"
                    onClick={() => setWarnOpen(false)}
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
            </>
          )}
          {phase === "idle" && (
            <div className="status-box">Awaiting details…</div>
          )}
        </div>
      </div>
    </div>
  );
}
