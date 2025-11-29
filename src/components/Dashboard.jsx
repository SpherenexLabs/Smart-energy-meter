// // src/pages/Dashboard.jsx
// import React, { useEffect, useState } from "react";
// import "./Dashboard.css";
// import { ref, onValue, update, serverTimestamp } from "firebase/database";
// import { db } from "../firebase/config";

// /**
//  * Dashboard
//  * - Subscribes to BOTH /meta and /profile so values stay live.
//  * - Ensures createdAt exists on the profile (writes once if missing).
//  * - Implements "Edit Profile" modal that persists to Realtime DB.
//  *   (We update the profile node only; Auth email change is not required.)
//  */
// export default function Dashboard({ user, customerId }) {
//   const [liveMeta, setLiveMeta] = useState(null);

//   // Live profile pulled locally (don't rely on initial prop)
//   const [profileData, setProfileData] = useState(null);

//   // Edit modal state
//   const [showEdit, setShowEdit] = useState(false);
//   const [editName, setEditName] = useState("");
//   const [editEmail, setEditEmail] = useState("");
//   const [saving, setSaving] = useState(false);

//   // Subscribe to /meta (lastLogin, etc.)
//   useEffect(() => {
//     if (!user) return;
//     const metaRef = ref(db, `Logging/users/${user.uid}/meta`);
//     const unsub = onValue(metaRef, (snap) => setLiveMeta(snap.val() || null));
//     return () => unsub();
//   }, [user]);

//   // Subscribe to /profile and backfill createdAt if missing
//   useEffect(() => {
//     if (!user) return;
//     const pRef = ref(db, `Logging/users/${user.uid}/profile`);
//     const unsub = onValue(pRef, async (snap) => {
//       const val = snap.exists() ? snap.val() : null;
//       setProfileData(val);

//       // If profile exists but has no createdAt, set it once
//       if (val && (val.createdAt === undefined || val.createdAt === null)) {
//         try {
//           await update(pRef, { createdAt: serverTimestamp() });
//         } catch (e) {
//           // ignore—rules may prevent non-owner writes; UI still works
//         }
//       }
//     });
//     return () => unsub();
//   }, [user]);

//   // Keep edit fields in sync with live profile
//   useEffect(() => {
//     if (!user) return;
//     setEditName((profileData?.name || "").toString());
//     setEditEmail((profileData?.email || user.email || "").toString());
//   }, [profileData, user]);

//   const handleCopy = () => {
//     if (customerId) navigator.clipboard.writeText(customerId);
//   };

//   const handleSave = async (e) => {
//     e.preventDefault();
//     if (!user) return;
//     setSaving(true);
//     const pRef = ref(db, `Logging/users/${user.uid}/profile`);
//     try {
//       await update(pRef, {
//         name: editName.trim(),
//         email: editEmail.trim(),
//         // Preserve existing createdAt; if missing, set now
//         createdAt: profileData?.createdAt ?? serverTimestamp(),
//       });
//       setShowEdit(false);
//     } catch (err) {
//       alert(err.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const createdAtMs = profileData?.createdAt;
//   const createdAtText =
//     typeof createdAtMs === "number"
//       ? new Date(createdAtMs).toLocaleString()
//       : "—";

//   return (
//     <div className="dashboard">
//       <section className="welcome card">
//         <div className="welcome-inner">
//           <div>
//             <h2>
//               Hello{profileData?.name ? `, ${profileData.name}` : ""}
//             </h2>
//             <p className="muted">
//               You're logged in with <strong>{user?.email}</strong>
//             </p>
//             <div className="cid">
//               <span className="badge">Customer ID</span>
//               <div className="cid-value" id="cid-value">
//                 {customerId || "—"}
//               </div>
//               <button className="copy-btn" onClick={handleCopy}>
//                 Copy
//               </button>
//             </div>
//           </div>

//           <div className="kpi">
//             <div className="kpi-item">
//               <span className="kpi-label">Last Login</span>
//               <span className="kpi-val">
//                 {liveMeta?.lastLogin
//                   ? new Date(liveMeta.lastLogin).toLocaleString()
//                   : "—"}
//               </span>
//             </div>
//             <div className="kpi-item">
//               <span className="kpi-label">Account Created</span>
//               <span className="kpi-val">{createdAtText}</span>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section className="info card">
//         <h3>Your Profile (Stored in Realtime Database)</h3>
//         <div className="grid grid-2">
//           <div>
//             <span className="label">Name</span>
//             <div className="field">{profileData?.name || "—"}</div>
//           </div>
//           <div>
//             <span className="label">Email</span>
//             <div className="field">{profileData?.email || user?.email}</div>
//           </div>
//           <div>
//             <span className="label">UID</span>
//             <div className="field monospace">{user?.uid}</div>
//           </div>
//           <div>
//             <span className="label">Customer ID</span>
//             <div className="field monospace">{customerId || "—"}</div>
//           </div>
//         </div>

//         <button className="edit-profile-btn primary-btn" onClick={() => setShowEdit(true)}>
//           Edit Profile
//         </button>

//         {showEdit && (
//           <div className="modal-overlay">
//             <div className="modal card" style={{ maxWidth: 520 }}>
//               <h4>Edit Profile</h4>
//               <form onSubmit={handleSave} className="edit-profile-form grid">
//                 <label>
//                   <span className="label">Name</span>
//                   <input
//                     className="input"
//                     type="text"
//                     value={editName}
//                     onChange={(e) => setEditName(e.target.value)}
//                     required
//                   />
//                 </label>
//                 <label>
//                   <span className="label">Email</span>
//                   <input
//                     className="input"
//                     type="email"
//                     value={editEmail}
//                     onChange={(e) => setEditEmail(e.target.value)}
//                     required
//                   />
//                 </label>
//                 <div className="modal-actions" style={{ display: "flex", gap: 12 }}>
//                   <button type="submit" className="primary-btn" disabled={saving}>
//                     {saving ? "Saving..." : "Save"}
//                   </button>
//                   <button
//                     type="button"
//                     className="secondary-btn"
//                     onClick={() => setShowEdit(false)}
//                     style={{
//                       border: "1px solid #d7e2ff",
//                       background: "#33c6daff",
//                       borderRadius: 10,
//                       padding: ".75rem 1rem",
//                     }}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
        
//       </section>
//     </div>
//   );
// }




// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import "../styles/plan.css";                   // NEW: styles for plan UI
import { ref, onValue, update, serverTimestamp, get } from "firebase/database";
import { db } from "../firebase/config";
import Prepaid from "../plans/Prepaid.jsx";    // NEW
import Postpaid from "../plans/Postpaid.jsx";  // NEW

export default function Dashboard({ user, customerId }) {
  const [liveMeta, setLiveMeta] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('daily');
  const [usageData, setUsageData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  });
  const [predictiveData, setPredictiveData] = useState(null);
  const [billHistory, setBillHistory] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Plan selection + lock
  const [activePlan, setActivePlan] = useState(null); // 'prepaid' | 'postpaid' | null
  const [sessionLocked, setSessionLocked] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!user) return;
    const metaRef = ref(db, `Logging/users/${user.uid}/meta`);
    const unsub = onValue(metaRef, (snap) => setLiveMeta(snap.val() || null));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const pRef = ref(db, `Logging/users/${user.uid}/profile`);
    const unsub = onValue(pRef, async (snap) => {
      const val = snap.exists() ? snap.val() : null;
      setProfileData(val);
      if (val && (val.createdAt === undefined || val.createdAt === null)) {
        try { await update(pRef, { createdAt: serverTimestamp() }); } catch {}
      }
    });
    return () => unsub();
  }, [user]);

  // Subscribe to Logging sensor data
  useEffect(() => {
    if (!user) return;
    const sensorRef = ref(db, `Logging`);
    let previousTheftStatus = null;
    
    const unsub = onValue(sensorRef, (snap) => {
      const data = snap.val();
      setSensorData(data);
      
      // Check for alerts
      if (data) {
        const newAlerts = [];
        // Check both data.Theft and data.Theft as object with value property
        const theftValue = typeof data.Theft === 'object' ? data.Theft?.value : data.Theft;
        if (theftValue === "1" || theftValue === 1) {
          newAlerts.push({ type: 'theft', message: 'Theft detected!', severity: 'critical' });
          
          // Show toast only when theft status changes from 0 to 1
          if (previousTheftStatus !== "1" && previousTheftStatus !== 1) {
            setToast("⚠️ ALERT: Theft Detected!");
            setTimeout(() => setToast(""), 5000);
          }
        }
        previousTheftStatus = theftValue;
        setAlerts(newAlerts);
        
        // Generate sample usage data for charts
        generateUsageData(data);
        
        // Generate predictive analysis
        generatePredictiveAnalysis(data);
      }
    });
    return () => unsub();
  }, [user]);

  // Fetch real bill history from Firebase
  useEffect(() => {
    if (!user) return;
    
    const fetchBillHistory = async () => {
      try {
        let historyData = [];
        
        // 1. Fetch user's session history (from Prepaid/Postpaid usage)
        const sessionsRef = ref(db, `Logging/users/${user.uid}/sessions`);
        const sessionsSnapshot = await get(sessionsRef);
        
        if (sessionsSnapshot.exists()) {
          const sessions = sessionsSnapshot.val();
          const sessionHistory = Object.entries(sessions).map(([key, session]) => ({
            id: key,
            date: session.createdAt ? new Date(session.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            amount: session.amount || 0,
            type: session.type === 'prepaid' ? 'Prepaid Recharge' : 'Postpaid Payment',
            status: session.state === 'completed' ? 'Paid' : session.state === 'running' ? 'Active' : 'Completed'
          }));
          historyData.push(...sessionHistory);
        }
        
        // 2. Fetch user's transaction history (if exists)
        const transactionsRef = ref(db, `Logging/users/${user.uid}/transactions`);
        const transactionsSnapshot = await get(transactionsRef);
        
        if (transactionsSnapshot.exists()) {
          const transactions = transactionsSnapshot.val();
          const transactionHistory = Object.entries(transactions).map(([key, transaction]) => ({
            id: key,
            date: transaction.date || new Date(transaction.timestamp || Date.now()).toLocaleDateString(),
            amount: transaction.amount || 0,
            type: transaction.type || 'Bill Payment',
            status: transaction.status || 'Paid'
          }));
          historyData.push(...transactionHistory);
        }
        
        // 3. Fetch user's recharge history (alternative path)
        const rechargeRef = ref(db, `Logging/users/${user.uid}/rechargeHistory`);
        const rechargeSnapshot = await get(rechargeRef);
        
        if (rechargeSnapshot.exists()) {
          const recharges = rechargeSnapshot.val();
          const rechargeHistory = Object.entries(recharges).map(([key, recharge]) => ({
            id: key,
            date: recharge.date || new Date(recharge.timestamp || Date.now()).toLocaleDateString(),
            amount: recharge.amount || 0,
            type: 'Recharge',
            status: recharge.status || 'Completed'
          }));
          historyData.push(...rechargeHistory);
        }
        
        // Sort by date (newest first) and limit to latest 10 entries
        historyData.sort((a, b) => new Date(b.date) - new Date(a.date));
        historyData = historyData.slice(0, 10);
        
        // Set bill history or fallback to sample data if no real data found
        setBillHistory(historyData.length > 0 ? historyData : [
          { id: 'sample1', date: '2024-09-01', amount: 1250, type: 'Bill Payment', status: 'Paid' },
          { id: 'sample2', date: '2024-08-15', amount: 500, type: 'Recharge', status: 'Completed' },
          { id: 'sample3', date: '2024-08-01', amount: 1180, type: 'Bill Payment', status: 'Paid' },
          { id: 'sample4', date: '2024-07-20', amount: 300, type: 'Recharge', status: 'Completed' },
          { id: 'sample5', date: '2024-07-01', amount: 1320, type: 'Bill Payment', status: 'Paid' }
        ]);
        
        console.log('📊 Bill history loaded:', historyData.length, 'records');
        
      } catch (error) {
        console.error('Error fetching bill history:', error);
        // Set fallback data in case of error
        setBillHistory([
          { id: 'error1', date: '2024-09-01', amount: 1250, type: 'Bill Payment', status: 'Paid' },
          { id: 'error2', date: '2024-08-15', amount: 500, type: 'Recharge', status: 'Completed' },
          { id: 'error3', date: '2024-08-01', amount: 1180, type: 'Bill Payment', status: 'Paid' }
        ]);
      }
    };
    
    fetchBillHistory();
    
    // Set up real-time listener for new sessions (to update bill history)
    const sessionsRef = ref(db, `Logging/users/${user.uid}/sessions`);
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      // Refetch bill history when sessions change
      fetchBillHistory();
    });
    
    return () => unsubscribe();
  }, [user]);

  // Generate sample usage data for different periods
  const generateUsageData = (currentData) => {
    const current = parseFloat(currentData?.Current || 0);
    const voltage = parseFloat(currentData?.Voltage || 0.1);
    const power = current * voltage; // Calculate power from current and voltage
    
    // Daily data (24 hours)
    const daily = Array.from({ length: 24 }, (_, i) => {
      const c = current + Math.sin(i * 0.5) * 2 + Math.random() * 1.5;
      const v = voltage + Math.sin(i * 0.2) * 10 + Math.random() * 5;
      return {
        time: `${i}:00`,
        current: c,
        power: c * v,
        voltage: v
      };
    });
    
    // Weekly data (7 days)
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const c = current + Math.sin(i * 0.8) * 3 + Math.random() * 2;
      const v = voltage + Math.sin(i * 0.4) * 15 + Math.random() * 8;
      return {
        time: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        current: c,
        power: c * v,
        voltage: v
      };
    });
    
    // Monthly data (30 days)
    const monthly = Array.from({ length: 30 }, (_, i) => {
      const c = current + Math.sin(i * 0.2) * 4 + Math.random() * 2.5;
      const v = voltage + Math.sin(i * 0.1) * 20 + Math.random() * 10;
      return {
        time: `Day ${i + 1}`,
        current: c,
        power: c * v,
        voltage: v
      };
    });
    
    // Yearly data (12 months)
    const yearly = Array.from({ length: 12 }, (_, i) => {
      const c = current + Math.sin(i * 0.5) * 5 + Math.random() * 3;
      const v = voltage + Math.sin(i * 0.25) * 25 + Math.random() * 15;
      return {
        time: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        current: c,
        power: c * v,
        voltage: v
      };
    });
    
    setUsageData({ daily, weekly, monthly, yearly });
  };
  
  const generatePredictiveAnalysis = (currentData) => {
    const current = parseFloat(currentData?.Current || 0);
    const voltage = parseFloat(currentData?.Voltage || 0.1);
    const power = current * voltage; // Calculate power from current and voltage
    const trend = Math.random() > 0.5 ? 'increasing' : 'decreasing';
    const percentage = (Math.random() * 20 + 5).toFixed(1);
    
    setPredictiveData({
      nextMonthUsage: (power * 30 * 24 / 1000).toFixed(2), // kWh
      trend,
      percentage,
      estimatedBill: ((power * 30 * 24 / 1000) * 6.5).toFixed(2), // ₹6.5 per kWh
      recommendation: trend === 'increasing' 
        ? 'Consider energy-saving measures to reduce consumption'
        : 'Your energy usage is optimized. Keep up the good practices!'
    });
    
    // Generate AI suggestions based on current usage
    generateAISuggestions(current, power, voltage);
  };

  const generateAISuggestions = (current, power, voltage) => {
    const suggestions = [];
    
    // High current usage detection (> 0.05A) - Show 3 suggestions
    if (current > 0.05) {
      suggestions.push({
        icon: '💡',
        title: 'High Current Detected',
        message: `Your current usage is ${current.toFixed(4)}A. Consider switching to energy-efficient LED bulbs and appliances to reduce current draw.`,
        priority: 'high',
        savings: '₹200-500/month'
      });
      
      suggestions.push({
        icon: '🔌',
        title: 'Unplug Idle Devices',
        message: 'Devices on standby mode still consume power. Unplug chargers, TVs, and other electronics when not in use.',
        priority: 'medium',
        savings: '₹100-200/month'
      });
      
      suggestions.push({
        icon: '⚡',
        title: 'High Power Consumption',
        message: `Power usage is ${power.toFixed(2)}W. Use appliances during off-peak hours (10 PM - 6 AM) for better rates.`,
        priority: 'high',
        savings: '₹300-600/month'
      });
    }
    // Medium current usage (0.03A - 0.05A) - Show 3 suggestions
    else if (current >= 0.03 && current <= 0.05) {
      suggestions.push({
        icon: '🌡️',
        title: 'Optimize Temperature Settings',
        message: 'Set your AC to 24-26°C and refrigerator to medium settings. Each degree can save 3-5% energy.',
        priority: 'medium',
        savings: '₹150-300/month'
      });
      
      suggestions.push({
        icon: '⏰',
        title: 'Smart Scheduling',
        message: 'Run washing machines, dishwashers during off-peak hours. Use timer switches for geysers.',
        priority: 'medium',
        savings: '₹150-250/month'
      });
      
      suggestions.push({
        icon: '☀️',
        title: 'Natural Light Usage',
        message: 'Maximize natural daylight during day hours. Turn off lights in unoccupied rooms.',
        priority: 'low',
        savings: '₹80-120/month'
      });
    }
    // Low current usage (0.02A - 0.03A) - Show 3 suggestions
    else if (current >= 0.02 && current < 0.03) {
      suggestions.push({
        icon: '☀️',
        title: 'Natural Light Usage',
        message: 'Maximize natural daylight during day hours. Turn off lights in unoccupied rooms.',
        priority: 'low',
        savings: '₹80-120/month'
      });
      
      suggestions.push({
        icon: '⏰',
        title: 'Smart Scheduling',
        message: 'Run washing machines, dishwashers during off-peak hours. Use timer switches for geysers.',
        priority: 'medium',
        savings: '₹150-250/month'
      });
      
      if (voltage > 8) {
        suggestions.push({
          icon: '🔧',
          title: 'Voltage Optimization',
          message: 'Higher voltage detected. Consider using voltage stabilizers to protect appliances and optimize power consumption.',
          priority: 'low',
          savings: '₹50-150/month'
        });
      } else {
        suggestions.push({
          icon: '🔌',
          title: 'Standby Power Management',
          message: 'Devices on standby mode consume power. Use smart power strips to completely cut power when not in use.',
          priority: 'low',
          savings: '₹60-100/month'
        });
      }
    }
    // Very low usage (< 0.02A) - Show 3 success messages
    else {
      suggestions.push({
        icon: '✅',
        title: 'Great Energy Habits!',
        message: 'Your current usage is optimal. Keep maintaining these energy-efficient practices.',
        priority: 'success',
        savings: 'Saving well!'
      });
      
      suggestions.push({
        icon: '🌟',
        title: 'Excellent Efficiency',
        message: 'Your energy consumption is below average. You are setting a great example for sustainable living!',
        priority: 'success',
        savings: 'Top performer!'
      });
      
      suggestions.push({
        icon: '🎯',
        title: 'Keep It Up',
        message: 'Continue monitoring your usage and share your energy-saving tips with others.',
        priority: 'success',
        savings: 'Well done!'
      });
    }
    
    // Always limit to exactly 3 suggestions
    setAiSuggestions(suggestions.slice(0, 3));
  };
  
  const downloadBillHistory = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Amount,Type,Status\n"
      + billHistory.map(bill => `${bill.date},₹${bill.amount},${bill.type},${bill.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "energy_meter_bill_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const createWavePath = (data, width, height, metric) => {
    if (!data || data.length === 0) return '';
    
    const maxValue = Math.max(...data.map(d => d[metric]));
    const minValue = Math.min(...data.map(d => d[metric]));
    const range = maxValue - minValue || 1;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const normalizedValue = (d[metric] - minValue) / range;
      const y = height - (normalizedValue * height * 0.8) - (height * 0.1);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const createdAtText =
    typeof profileData?.createdAt === "number"
      ? new Date(profileData.createdAt).toLocaleString()
      : "—";

  const handleComplete = (msg) => {
    setToast(msg || "Your selected duration is completed. Thanks for using.");
    setSessionLocked(false);
    setActivePlan(null);
    // auto-hide toast after 8s
    setTimeout(() => setToast(""), 8000);
  };

  return (
    <div className="dashboard">
      <section className="welcome card">
        <div className="welcome-inner">
          <div>
            <h2>Hello{profileData?.name ? `, ${profileData.name}` : ""}</h2>
            <p className="muted">
              You're logged in with <strong>{user?.email}</strong>
            </p>
            <div className="cid">
              <span className="badge">Customer ID</span>
              <div className="cid-value" id="cid-value">{customerId || "—"}</div>
              <button className="copy-btn" onClick={()=>customerId && navigator.clipboard.writeText(customerId)}>Copy</button>
            </div>
          </div>

          <div className="kpi">
            <div className="kpi-item">
              <span className="kpi-label">Last Login</span>
              <span className="kpi-val">
                {liveMeta?.lastLogin ? new Date(liveMeta.lastLogin).toLocaleString() : "—"}
              </span>
            </div>
            <div className="kpi-item">
              <span className="kpi-label">Account Created</span>
              <span className="kpi-val">{createdAtText}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="info card">
        <h3>Your Profile (Stored in Logging Directory)</h3>
        <div className="grid grid-2">
          <div><span className="label">Name</span><div className="field">{profileData?.name || "—"}</div></div>
          <div><span className="label">Email</span><div className="field">{profileData?.email || user?.email}</div></div>
          <div><span className="label">UID</span><div className="field monospace">{user?.uid}</div></div>
          <div><span className="label">Customer ID</span><div className="field monospace">{customerId || "—"}</div></div>
        </div>
      </section>

      {/* ---------- Sensor Monitoring Section ---------- */}
      {alerts.length > 0 && (
        <section className="alerts-section">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert alert-${alert.severity}`}>
              <span className="alert-icon">⚠️</span>
              <span className="alert-message">{alert.message}</span>
              <button className="alert-close" onClick={() => setAlerts(alerts.filter((_, i) => i !== index))}>
                ×
              </button>
            </div>
          ))}
        </section>
      )}


   {/* ---------- Billing Options Section ---------- */}
      <section className="card plan-card">
        <div className="plan-header">
          <h3>Choose Service</h3>
          <div className="segmented">
            <button
              className={`seg-btn ${activePlan === 'prepaid' ? 'active' : ''}`}
              onClick={() => setActivePlan('prepaid')}
              disabled={sessionLocked && activePlan !== 'prepaid'}
              title={sessionLocked && activePlan !== 'prepaid' ? "Complete current session to switch" : "Prepaid"}
            >
              Prepaid
            </button>
            <button
              className={`seg-btn ${activePlan === 'postpaid' ? 'active' : ''}`}
              onClick={() => setActivePlan('postpaid')}
              disabled={sessionLocked && activePlan !== 'postpaid'}
              title={sessionLocked && activePlan !== 'postpaid' ? "Complete current session to switch" : "Postpaid"}
            >
              Postpaid
            </button>
          </div>
        </div>

        {!activePlan && (
          <div className="plan-placeholder">
            <p>Select <strong>Prepaid</strong> or <strong>Postpaid</strong> to continue.</p>
          </div>
        )}

        {activePlan === "prepaid" && (
          <Prepaid
            user={user}
            db={db}
            lockSession={() => setSessionLocked(true)}
            onComplete={(m) => handleComplete(m)}
          />
        )}

        {activePlan === "postpaid" && (
          <Postpaid
            user={user}
            db={db}
            lockSession={() => setSessionLocked(true)}
            onComplete={(m) => handleComplete(m)}
          />
        )}
      </section>




      <section className="sensor-monitoring card">
        <h3>Real-time Sensor Monitoring</h3>
        
        {sensorData ? (
          <div className="sensor-grid">
            {/* Check if relay is ON to show sensor values */}
            {sensorData.Relay === 1 ? (
              /* Advanced Analytics Card - Show only when Relay is ON */
              <div className="analytics-card sensor-card">
                <div className="analytics-header">
                  <h4>Usage Analytics</h4>
                  <div className="period-selector">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
                      <button 
                        key={period}
                        className={`period-btn ${chartPeriod === period ? 'active' : ''}`}
                        onClick={() => setChartPeriod(period)}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="analytics-charts">
                  {/* Current Chart */}
                  <div className="chart-container">
                    <div className="chart-title">Current (A)</div>
                    <svg viewBox="0 0 300 100" className="wave-chart current-chart">
                      <defs>
                        <linearGradient id="currentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      <path
                        d={createWavePath(usageData[chartPeriod], 300, 100, 'current')}
                        stroke="#4CAF50"
                        strokeWidth="2"
                        fill="none"
                        className="wave-path"
                      />
                      <path
                        d={`${createWavePath(usageData[chartPeriod], 300, 100, 'current')} L 300,100 L 0,100 Z`}
                        fill="url(#currentGradient)"
                        className="wave-fill"
                      />
                    </svg>
                    <div className="current-value">{sensorData?.Current || "0.00"} A</div>
                  </div>
                  
                  {/* Power Chart */}
                  <div className="chart-container">
                    <div className="chart-title">Power (W)</div>
                    <svg viewBox="0 0 300 100" className="wave-chart power-chart">
                      <defs>
                        <linearGradient id="powerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#2196F3" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#2196F3" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      <path
                        d={createWavePath(usageData[chartPeriod], 300, 100, 'power')}
                        stroke="#2196F3"
                        strokeWidth="2"
                        fill="none"
                        className="wave-path"
                      />
                      <path
                        d={`${createWavePath(usageData[chartPeriod], 300, 100, 'power')} L 300,100 L 0,100 Z`}
                        fill="url(#powerGradient)"
                        className="wave-fill"
                      />
                    </svg>
                    <div className="power-value">{(parseFloat(sensorData?.Current || 0) * parseFloat(sensorData?.Voltage || 0)).toFixed(2)} W</div>
                  </div>
                  
                  {/* Voltage Chart */}
                  <div className="chart-container">
                    <div className="chart-title">Voltage (V)</div>
                    <svg viewBox="0 0 300 100" className="wave-chart voltage-chart">
                      <defs>
                        <linearGradient id="voltageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FF9800" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#FF9800" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      <path
                        d={createWavePath(usageData[chartPeriod], 300, 100, 'voltage')}
                        stroke="#FF9800"
                        strokeWidth="2"
                        fill="none"
                        className="wave-path"
                      />
                      <path
                        d={`${createWavePath(usageData[chartPeriod], 300, 100, 'voltage')} L 300,100 L 0,100 Z`}
                        fill="url(#voltageGradient)"
                        className="wave-fill"
                      />
                    </svg>
                    <div className="voltage-value">{sensorData?.Voltage || "0.10"} V</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Relay OFF Message */
              <div className="analytics-card sensor-card relay-off-card">
                <div className="analytics-header">
                  <h4>Usage Analytics</h4>
                  <span className="relay-status off">🔴 Relay OFF</span>
                </div>
                <div className="relay-off-message">
                  <div className="offline-icon">⚡</div>
                  <h5>Power Supply Disconnected</h5>
                  <p>Sensor readings are not available when the relay is OFF. Turn on the relay to monitor real-time usage data.</p>
                  <div className="offline-stats">
                    <div className="offline-stat">
                      <span className="stat-label">Current:</span>
                      <span className="stat-value">-- A</span>
                    </div>
                    <div className="offline-stat">
                      <span className="stat-label">Power:</span>
                      <span className="stat-value">-- W</span>
                    </div>
                    <div className="offline-stat">
                      <span className="stat-label">Voltage:</span>
                      <span className="stat-value">-- V</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Predictive Analysis Card */}
            <div className="sensor-card predictive-card">
              <div className="sensor-header">
                <h4>🔮 Predictive Analysis</h4>
                <span className="prediction-badge">AI Powered</span>
              </div>
              {predictiveData && (
                <div className="prediction-content">
                  <div className="prediction-item">
                    <span className="prediction-label">Next Month Usage:</span>
                    <span className="prediction-value">{predictiveData.nextMonthUsage} kWh</span>
                  </div>
                  <div className="prediction-item">
                    <span className="prediction-label">Trend:</span>
                    <span className={`prediction-trend ${predictiveData.trend}`}>
                      {predictiveData.trend === 'increasing' ? '📈' : '📉'} {predictiveData.percentage}% {predictiveData.trend}
                    </span>
                  </div>
                  <div className="prediction-item">
                    <span className="prediction-label">Estimated Bill:</span>
                    <span className="prediction-bill">₹{predictiveData.estimatedBill}</span>
                  </div>
                  <div className="recommendation">
                    <div className="recommendation-title">💡 Recommendation:</div>
                    <div className="recommendation-text">{predictiveData.recommendation}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bill History Card */}
            <div className="sensor-card bill-history-card">
              <div className="sensor-header">
                <h4>📊 Bill & Recharge History</h4>
                <button className="download-btn" onClick={downloadBillHistory}>
                  📥 Download CSV
                </button>
              </div>
              <div className="bill-history-content">
                <div className="history-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Type</span>
                    <span>Amount</span>
                    <span>Status</span>
                  </div>
                  {billHistory.map(bill => (
                    <div key={bill.id} className="table-row">
                      <span className="bill-date">{bill.date}</span>
                      <span className={`bill-type ${bill.type.toLowerCase().replace(' ', '-')}`}>
                        {bill.type}
                      </span>
                      <span className="bill-amount">₹{bill.amount}</span>
                      <span className={`bill-status ${bill.status.toLowerCase()}`}>
                        {bill.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Safety Monitoring Card */}
            <div className="sensor-card safety-card">
              <div className="sensor-header">
                <h4>Safety Status</h4>
                <span className="sensor-value">
                  {(typeof sensorData.Theft === 'object' ? sensorData.Theft?.value : sensorData.Theft) === "1" || (typeof sensorData.Theft === 'object' ? sensorData.Theft?.value : sensorData.Theft) === 1 ? 'Alert' : 'All Clear'}
                </span>
              </div>
              <div className="safety-indicators">
                <div className="safety-item">
                  <span className="safety-label">Relay:</span>
                  <span className={`relay-status ${sensorData.Relay === 1 ? 'on' : 'off'}`}>
                    {sensorData.Relay === 1 ? '🟢 ON' : '🔴 OFF'}
                  </span>
                </div>
                <div className="safety-item">
                  <span className="safety-label">Theft:</span>
                  <span className={`safety-status ${(typeof sensorData.Theft === 'object' ? sensorData.Theft?.value : sensorData.Theft) === "1" || (typeof sensorData.Theft === 'object' ? sensorData.Theft?.value : sensorData.Theft) === 1 ? 'danger' : 'safe'}`}>
                    {(typeof sensorData.Theft === 'object' ? sensorData.Theft?.value : sensorData.Theft) === "1" || (typeof sensorData.Theft === 'object' ? sensorData.Theft?.value : sensorData.Theft) === 1 ? '⚠️ Detected' : '✅ Safe'}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance & Usage Card */}
            <div className="sensor-card balance-card">
              <div className="sensor-header">
                <h4>Account Balance</h4>
                <span className="sensor-value">₹{sensorData.Balance || "140"}</span>
              </div>
              <div className="balance-info">
                <div className="balance-item">
                  <span className="balance-label">Available:</span>
                  <span className="balance-amount">₹{sensorData.Balance || "140"}</span>
                </div>
                <div className="balance-item">
                  <span className="balance-label">Last Updated:</span>
                  <span className="balance-time">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="balance-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min((parseFloat(sensorData.Balance || 140) / 200) * 100, 100)}%` }}
                  ></div>
                </div>
                
              </div>
            </div>

            {/* System Status Card */}
            <div className="sensor-card system-card">
              <div className="sensor-header">
                <h4>System Status</h4>
                <span className={`system-status ${alerts.length === 0 ? 'online' : 'warning'}`}>
                  {alerts.length === 0 ? '🟢 Online' : '⚠️ Alert'}
                </span>
              </div>
              <div className="system-info">
                <div className="system-item">
                  <span className="system-label">Connection:</span>
                  <span className="system-value">Connected</span>
                </div>
                <div className="system-item">
                  <span className="system-label">Last Update:</span>
                  <span className="system-value">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="system-item">
                  <span className="system-label">Uptime:</span>
                  <span className="system-value">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="sensor-loading">
            <div className="loading-spinner"></div>
            <p>Loading sensor data...</p>
          </div>
        )}
      </section>

      {/* AI Suggestions Section */}
      {aiSuggestions.length > 0 && (
        <section className="card ai-suggestions-section">
          <div className="ai-header">
            <h3>🤖 AI-Powered Energy Saving Suggestions</h3>
            <span className="ai-badge">Smart Recommendations</span>
          </div>
          <div className="suggestions-grid">
            {aiSuggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className={`suggestion-card priority-${suggestion.priority}`}
              >
                <div className="suggestion-icon">{suggestion.icon}</div>
                <div className="suggestion-content">
                  <h4 className="suggestion-title">{suggestion.title}</h4>
                  <p className="suggestion-message">{suggestion.message}</p>
                  <div className="suggestion-footer">
                    <span className={`priority-badge ${suggestion.priority}`}>
                      {suggestion.priority === 'high' ? '🔴 High Priority' : 
                       suggestion.priority === 'medium' ? '🟡 Medium Priority' : 
                       suggestion.priority === 'success' ? '✅ Excellent' : '🟢 Low Priority'}
                    </span>
                    <span className="savings-badge">💰 {suggestion.savings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="ai-footer">
            <p>💡 <strong>Tip:</strong> Implementing these suggestions can help reduce your electricity bill significantly!</p>
          </div>
        </section>
      )}

      {toast && (
        <div className={toast.includes('Theft') || toast.includes('ALERT') ? 'toast-alert' : 'toast-success'}>
          {toast}
        </div>
      )}
    </div>
  );
}
