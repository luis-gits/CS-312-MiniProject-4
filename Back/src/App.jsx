import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";

export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const { data } = await api.get("/auth/me");
      setMe(data.user);
    } catch { setMe(null); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadMe(); }, []);

  async function signOut() {
    await api.post("/auth/signout");
    setMe(null);
  }

  if (loading) return <div style={{ padding:16 }}>Loading…</div>;

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:16 }}>
      <nav style={{ display:"flex", gap:12, paddingBottom:12, borderBottom:"1px solid #ddd", marginBottom:16 }}>
        <Link to="/">Home</Link>
        {!me && <Link to="/signin">Sign In</Link>}
        {!me && <Link to="/signup">Sign Up</Link>}
        {me && <span>Hi, {me.name}</span>}
        {me && <button onClick={signOut}>Sign out</button>}
      </nav>

      <Routes>
        <Route path="/" element={<Home me={me} />} />
        <Route path="/signin" element={me ? <Navigate to="/" /> : <SignIn onAuthed={loadMe} />} />
        <Route path="/signup" element={me ? <Navigate to="/" /> : <SignUp onAuthed={loadMe} />} />
      </Routes>
    </div>
  );
}
