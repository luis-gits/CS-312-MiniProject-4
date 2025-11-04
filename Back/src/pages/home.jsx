import { useEffect, useState } from "react";
import { api } from "../api";

function BlogPostForm({ initial, onSubmit, submitLabel="Create" }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [body, setBody] = useState(initial?.body || "");
  useEffect(() => { if (initial) { setTitle(initial.title); setBody(initial.body); } }, [initial]);
  function handle(e){ e.preventDefault(); onSubmit?.({ title, body }); }
  return (
    <form onSubmit={handle} style={{ display:"grid", gap:8 }}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" required />
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Body" rows={6} required />
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export default function Home({ me }) {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    const { data } = await api.get("/posts");
    setPosts(data.posts);
  }
  useEffect(() => { load(); }, []);

  async function createPost(data) {
    try {
      const res = await api.post("/posts", data);
      setPosts(p => [res.data.post, ...p]);
    } catch (e) {
      setErr(e.response?.data?.error || "error");
    }
  }

  async function updatePost(id, data) {
    try {
      const res = await api.put(`/posts/${id}`, data);
      setPosts(p => p.map(x => x.blog_id === id ? res.data.post : x));
      setEditing(null);
    } catch (e) {
      setErr(e.response?.data?.error || "error");
    }
  }

  async function deletePost(id) {
    try {
      await api.delete(`/posts/${id}`);
      setPosts(p => p.filter(x => x.blog_id !== id));
    } catch (e) {
      setErr(e.response?.data?.error || "error");
    }
  }

  return (
    <div style={{ display:"grid", gap:24 }}>
      <h2>Blog</h2>
      {err && <p style={{ color:"red" }}>{err}</p>}

      {me ? (
        editing ? (
          <div>
            <h3>Edit post</h3>
            <BlogPostForm
              initial={{ title: editing.title, body: editing.body }}
              submitLabel="Update"
              onSubmit={(payload) => updatePost(editing.blog_id, payload)}
            />
            <button style={{ marginTop:8 }} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        ) : (
          <div>
            <h3>Create a post</h3>
            <BlogPostForm onSubmit={createPost} />
          </div>
        )
      ) : (
        <p>Sign in to create or edit posts.</p>
      )}

      <div style={{ display:"grid", gap:16 }}>
        {posts.map(p => (
          <article key={p.blog_id} style={{ border:"1px solid #ddd", padding:12, borderRadius:8 }}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
            <small>By {p.creator_name}</small>
            {me?.user_id === p.creator_user_id && (
              <div style={{ marginTop:8, display:"flex", gap:8 }}>
                <button onClick={() => setEditing(p)}>Edit</button>
                <button onClick={() => deletePost(p.blog_id)}>Delete</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
