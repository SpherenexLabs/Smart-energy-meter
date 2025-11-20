// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import AuthScreen from "./components/Auth.jsx";
import Dashboard from "./components/Dashboard.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase/config.js";
import { ref, get, set, serverTimestamp, update } from "firebase/database";
import { makeCustomerId } from "./utils/customerId.js";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setCustomerId(null);
        return;
      }
      await update(ref(db, `Logging/users/${u.uid}/meta`), {
        lastLogin: serverTimestamp(),
      });

      const baseRef = ref(db, `Logging/users/${u.uid}`);
      const baseSnap = await get(baseRef);
      const data = baseSnap.exists() ? baseSnap.val() : {};
      setProfile(data.profile || null);

      const cidRef = ref(db, `Logging/users/${u.uid}/customerId`);
      const cidSnap = await get(cidRef);
      if (cidSnap.exists() && cidSnap.val()) {
        setCustomerId(cidSnap.val());
      } else {
        const newId = makeCustomerId(u.uid);
        await set(cidRef, newId);
        setCustomerId(newId);
      }
      navigate("/");
    });
    return () => unsub();
  }, [navigate]);

  const logout = async () => {
    await signOut(auth);
    navigate("/auth");
  };

  const handleAdminLogin = (adminData) => {
    setAdmin(adminData);
    navigate("/admin-dashboard");
  };

  const handleAdminLogout = () => {
    setAdmin(null);
    navigate("/");
  };

  return (
    <>
      {!admin && <Header user={user} customerId={customerId} onLogout={logout} />}
      <main className={admin ? "" : "container"}>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Dashboard user={user} profile={profile} customerId={customerId} />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/auth"
            element={!user ? <AuthScreen /> : <Navigate to="/" />}
          />
          <Route
            path="/admin"
            element={
              !admin ? (
                <AdminLogin onAdminLogin={handleAdminLogin} />
              ) : (
                <Navigate to="/admin-dashboard" />
              )
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              admin ? (
                <AdminDashboard admin={admin} onLogout={handleAdminLogout} />
              ) : (
                <Navigate to="/admin" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
