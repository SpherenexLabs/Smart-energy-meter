// // src/plans/Postpaid.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import "./shared.css";
// import { ref, set, push, serverTimestamp, update } from "firebase/database";

// /**
//  * Postpaid
//  * - Select date + start time + duration
//  * - Same pricing (1 min = ₹10) and same flow as Prepaid
//  */
// export default function Postpaid({ user, db, lockSession, onComplete }) {
//   const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10)); // YYYY-MM-DD
//   const [time, setTime] = useState(()=> new Date().toISOString().slice(11,16)); // HH:MM
//   const [minutes, setMinutes] = useState(15);
//   const [phase, setPhase] = useState("idle");
//   const [warnOpen, setWarnOpen] = useState(false);
//   const [statusText, setStatusText] = useState("");

//   const totalMs = useMemo(()=>Math.max(1, Number(minutes)) * 60 * 1000, [minutes]);
//   const [remainingMs, setRemainingMs] = useState(totalMs);
//   const intervalRef = useRef(null);
//   const sessionRef = useRef(null);

//   useEffect(()=>{ setRemainingMs(totalMs); },[totalMs]);

//   const amount = (Number(minutes) || 0) * 10;

//   const startSession = async (startAt) => {
//     const sessionsPath = ref(db, `Logging/users/${user.uid}/sessions`);
//     const newRef = push(sessionsPath);
//     sessionRef.current = newRef;
//     await set(newRef, {
//       type: "postpaid",
//       state: "scheduled",
//       startAt: startAt ?? serverTimestamp(),
//       minutes: Number(minutes),
//       amount,
//       createdAt: serverTimestamp()
//     });

//     if (startAt && startAt > Date.now()) {
//       setPhase("scheduled");
//       setStatusText(`Scheduled for ${new Date(startAt).toLocaleString()}`);
//       setTimeout(()=> doStartRun(), startAt - Date.now());
//     } else {
//       doStartRun();
//     }
//   };

//   const doStartRun = async ()=>{
//     lockSession?.();
//     await update(sessionRef.current, { state: "running", realStart: serverTimestamp() });
//     await set(ref(db, "Logging/Relay"), "1");
//     setPhase("running");
//     setStatusText("Power ON. Session started.");

//     const t0 = Date.now();
//     clearInterval(intervalRef.current);
//     intervalRef.current = setInterval(()=>{
//       const elapsed = Date.now() - t0;
//       const left = Math.max(0, totalMs - elapsed);
//       setRemainingMs(left);
//       if (left <= 3*60*1000 && left > 0 && !warnOpen) setWarnOpen(true);
//       if (left <= 0) {
//         clearInterval(intervalRef.current);
//         finishSession();
//       }
//     }, 1000);
//   };

//   const finishSession = async ()=>{
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
//     setStatusText("Initializing payment…");
//     setTimeout(async ()=>{
//       setStatusText("Payment completed.");
//       const [Y,M,D] = date.split("-").map(Number);
//       const [h,m] = time.split(":").map(Number);
//       const sched = new Date(Y, M-1, D, h, m, 0, 0).getTime();
//       await startSession(sched);
//     }, 10000);
//   };

//   const pct = Math.max(0, Math.min(100, 100 - (remainingMs/totalMs)*100));

//   return (
//     <div className="plan-body">
//       <div className="plan-grid">
//         <form className="plan-form card" onSubmit={handlePayment}>
//           <h4>Postpaid</h4>

//           <div className="field-row">
//             <label className="label">Date</label>
//             <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} disabled={phase!=='idle'}/>
//           </div>

//           <div className="field-row">
//             <label className="label">Start Time</label>
//             <input type="time" className="input" value={time} onChange={e=>setTime(e.target.value)} disabled={phase!=='idle'}/>
//           </div>

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




// src/plans/Postpaid.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./shared.css";
import { ref, set, push, serverTimestamp, update, onValue } from "firebase/database";

/**
 * Postpaid
 * - Select date + start time + duration
 * - Amount: 1 min = ₹10
 * - Simulates payment (10s), then starts session
 * - Sets Logging/Relay to "1" at start, "0" at end
 * - Writes computed amount to Logging/Balance after payment
 */
export default function Postpaid({ user, db, lockSession, onComplete }) {
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  ); // YYYY-MM-DD
  const [time, setTime] = useState(() =>
    new Date().toISOString().slice(11, 16)
  ); // HH:MM
  const [minutes, setMinutes] = useState(15);
  const [phase, setPhase] = useState("idle");
  const [warnOpen, setWarnOpen] = useState(false);
  const [statusText, setStatusText] = useState("");

  const totalMs = useMemo(
    () => Math.max(1, Number(minutes)) * 60 * 1000,
    [minutes]
  );
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const intervalRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    setRemainingMs(totalMs);
  }, [totalMs]);

  // Monitor theft detection - disconnect power if theft is detected
  useEffect(() => {
    if (!db || phase !== "running") return;
    
    const theftRef = ref(db, "Logging/Theft");
    const unsubscribe = onValue(theftRef, async (snapshot) => {
      const theftValue = snapshot.val();
      const isTheft = theftValue === 1 || theftValue === "1";
      
      if (isTheft && phase === "running") {
        // Theft detected - immediately disconnect power
        clearInterval(intervalRef.current);
        await set(ref(db, "Logging/Relay"), 0);
        await update(sessionRef.current, {
          state: "terminated",
          reason: "theft_detected",
          finishedAt: serverTimestamp(),
        });
        setPhase("done");
        setStatusText("⚠️ THEFT DETECTED! Power disconnected for safety.");
        onComplete?.("Session terminated due to theft detection. Please contact support.");
      }
    });
    
    return () => unsubscribe();
  }, [db, phase, onComplete]);

  const amount = (Number(minutes) || 0) * 10; // ₹

  const startSession = async (startAt) => {
    const sessionsPath = ref(db, `Logging/users/${user.uid}/sessions`);
    const newRef = push(sessionsPath);
    sessionRef.current = newRef;
    await set(newRef, {
      type: "postpaid",
      state: "scheduled",
      startAt: startAt ?? serverTimestamp(),
      minutes: Number(minutes),
      amount,
      createdAt: serverTimestamp(),
    });

    if (startAt && startAt > Date.now()) {
      setPhase("scheduled");
      setStatusText(`Scheduled for ${new Date(startAt).toLocaleString()}`);
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
    await set(ref(db, "Logging/Relay"), 1); // Relay ON
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
    await set(ref(db, "Logging/Relay"), 0); // Relay OFF
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
    setStatusText("Initializing payment…");
    setTimeout(async () => {
      setStatusText("Payment completed.");
      // ✅ ALSO update Balance with the same amount (as string to match your DB)
      await set(ref(db, "Logging/Balance"), String(amount));

      const [Y, M, D] = date.split("-").map(Number);
      const [h, m] = time.split(":").map(Number);
      const sched = new Date(Y, M - 1, D, h, m, 0, 0).getTime();
      await startSession(sched);
    }, 10000);
  };

  const pct = Math.max(0, Math.min(100, 100 - (remainingMs / totalMs) * 100));

  return (
    <div className="plan-body">
      <div className="plan-grid">
        <form className="plan-form card" onSubmit={handlePayment}>
          <h4>Postpaid</h4>

          <div className="field-row">
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={phase !== "idle"}
            />
          </div>

          <div className="field-row">
            <label className="label">Start Time</label>
            <input
              type="time"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={phase !== "idle"}
            />
          </div>

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
                  <div className="alert-title">Only few minutes left</div>
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
