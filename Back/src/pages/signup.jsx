import { useState } from "react";
import { api } from "../api";

export default function SignUp({ onAuthed }) {
  const [form, setForm] = useState({ user_id:"", name:"", password:"" });
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/auth/signup", form);
      // after signup, go sign in automatically
      await api.post("/auth/signin", { user_id: form.user_id, password: form.password });
      onAuthed?.();
    } catch (e) {
      setErr(e.response?.data?.error || "error");
    }
  }

  return (
    <form onSubmit={submit} style={{ maxWidth:420, margin:"24px auto", display:"grid", gap:8 }}>
      <h2>Sign up</h2>
      {err && <p style={{ color:"red" }}>{err}</p>}
      <input placeholder="User ID" value={form.user_id}
             onChange={e=>setForm({ ...form, user_id:e.target.value })} required />
      <input placeholder="Name" value={form.name}
             onChange={e=>setForm({ ...form, name:e.target.value })} required />
      <input type="password" placeholder="Password" value={form.password}
             onChange={e=>setForm({ ...form, password:e.target.value })} required />
      <button type="submit">Create account</button>
    </form>
  );
}
