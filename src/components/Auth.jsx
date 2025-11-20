// src/components/Auth.jsx
import React, { useState } from "react";
import "./Auth.css";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set, serverTimestamp } from "firebase/database";
import { auth, db } from "../firebase/config";
import { BANNER_URL } from "../firebase/branding";

export default function Auth(){
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const onChange = (e)=> setForm(prev=>({...prev,[e.target.name]:e.target.value}));

  const submit = async (e)=>{
    e.preventDefault();
    setLoading(true);
    try{
      if(mode==="signup"){
        const { user } = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
        if(form.name.trim()){
          await updateProfile(user, { displayName: form.name.trim() });
        }
        await set(ref(db, `Logging/users/${user.uid}/profile`), {
          name: form.name.trim() || "",
          email: user.email,
          createdAt: serverTimestamp()
        });
      }else{
        await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      }
    }catch(err){
      alert(err.message);
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="auth-grid">
      <div className="auth-hero" style={{ backgroundImage:`url(${BANNER_URL})` }}>
        <div className="overlay">
          <h1>Welcome to Energy Management</h1>
          <p>Login or create your account to get your Customer ID and manage your details.</p>
        </div>
      </div>

      <div className="auth-card card">
        <div className="tabs">
          <button className={`tab ${mode==="login"?"active":""}`} onClick={()=>setMode("login")}>Login</button>
          <button className={`tab ${mode==="signup"?"active":""}`} onClick={()=>setMode("signup")}>Create Account</button>
        </div>

        <form className="grid" onSubmit={submit}>
          {mode==="signup" && (
            <div>
              <label className="label">Full Name</label>
              <input className="input" name="name" placeholder="Your name" value={form.name} onChange={onChange} required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={onChange} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" name="password" type="password" minLength={6} placeholder="Minimum 6 characters" value={form.password} onChange={onChange} required />
          </div>

          <button className="primary-btn" disabled={loading}>{loading ? "Please wait..." : (mode==="signup" ? "Create Account" : "Login")}</button>
        </form>
      </div>
    </div>
  );
}
