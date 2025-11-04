import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import session from 'express-session';
import flash from 'connect-flash';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pool from './db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.session.user;
  next();
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
    res.render('index', { posts: result.rows });
  } catch (err) {
    res.send('Error loading posts.');
  }
});

app.get('/signup', (req, res) => res.render('signup'));
app.get('/signin', (req, res) => res.render('signin'));

app.post('/signup', async (req, res) => {
  const { user_id, password, name } = req.body;
  try {
    const checkUser = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (checkUser.rows.length > 0) {
      req.flash('error', 'User ID already taken.');
      return res.redirect('/signup');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (user_id, password_hash, name, created_at) VALUES ($1, $2, $3, NOW())',
      [user_id, hashedPassword, name]
    );
    req.flash('success', 'Signup successful.');
    res.redirect('/signin');
  } catch (err) {
    req.flash('error', 'Error signing up.');
    res.redirect('/signup');
  }
});

app.post('/signin', async (req, res) => {
  const { user_id, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    const user = result.rows[0];
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/signin');
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Incorrect password.');
      return res.redirect('/signin');
    }
    req.session.user = user;
    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/');
  } catch (err) {
    req.flash('error', 'Error signing in.');
    res.redirect('/signin');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/new', (req, res) => {
  if (!req.session.user) return res.redirect('/signin');
  res.render('new');
});

app.post('/new', async (req, res) => {
  const { title, body } = req.body;
  const user = req.session.user;
  if (!user) return res.redirect('/signin');
  try {
    await pool.query(
      'INSERT INTO blogs (creator_user_id, creator_name, title, body, date_created) VALUES ($1, $2, $3, $4, NOW())',
      [user.user_id, user.name, title, body]
    );
    req.flash('success', 'Post created!');
    res.redirect('/');
  } catch (err) {
    req.flash('error', 'Error creating post.');
    res.redirect('/new');
  }
});

app.get('/blogs/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [req.params.id]);
    const blog = result.rows[0];
    if (!blog) return res.send('Post not found');
    res.render('show', { post: blog });
  } catch {
    res.send('Error loading post.');
  }
});

app.get('/blogs/:id/edit', async (req, res) => {
  const user = req.session.user;
  try {
    const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [req.params.id]);
    const blog = result.rows[0];
    if (!user || blog.creator_user_id !== user.user_id) return res.redirect('/');
    res.render('edit', { post: blog });
  } catch {
    res.send('Error loading post.');
  }
});

app.put('/blogs/:id', async (req, res) => {
  const { title, body } = req.body;
  const user = req.session.user;
  try {
    const blogResult = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [req.params.id]);
    const blog = blogResult.rows[0];
    if (!user || blog.creator_user_id !== user.user_id) return res.redirect('/');
    await pool.query('UPDATE blogs SET title = $1, body = $2, date_updated = NOW() WHERE blog_id = $3', [
      title, body, req.params.id,
    ]);
    req.flash('success', 'Post updated!');
    res.redirect(`/blogs/${req.params.id}`);
  } catch {
    req.flash('error', 'Error updating post.');
    res.redirect('/');
  }
});

app.delete('/blogs/:id', async (req, res) => {
  const user = req.session.user;
  try {
    const blogResult = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [req.params.id]);
    const blog = blogResult.rows[0];
    if (!user || blog.creator_user_id !== user.user_id) return res.redirect('/');
    await pool.query('DELETE FROM blogs WHERE blog_id = $1', [req.params.id]);
    req.flash('success', 'Post deleted.');
    res.redirect('/');
  } catch {
    req.flash('error', 'Error deleting post.');
    res.redirect('/');
  }
});

/* ---------- JSON API ---------- */
function authRequired(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.post('/api/auth/signup', async (req, res) => {
  const { user_id, password, name } = req.body || {};
  if (!user_id || !password || !name) return res.status(400).json({ error: 'missing fields' });
  try {
    const exists = await pool.query('SELECT 1 FROM users WHERE user_id=$1', [user_id]);
    if (exists.rowCount) return res.status(409).json({ error: 'user exists' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (user_id, password_hash, name, created_at) VALUES ($1,$2,$3,NOW())',
      [user_id, hash, name]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  const { user_id, password } = req.body || {};
  if (!user_id || !password) return res.status(400).json({ error: 'missing fields' });
  try {
    const r = await pool.query('SELECT * FROM users WHERE user_id=$1', [user_id]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    req.session.user = { user_id: user.user_id, name: user.name };
    res.json({ ok: true, user: req.session.user });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/auth/signout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'unauthorized' });
  res.json({ user: req.session.user });
});

app.get('/api/posts', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
    res.json({ posts: result.rows });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/posts', authRequired, async (req, res) => {
  const { title, body } = req.body || {};
  const u = req.session.user;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  try {
    const r = await pool.query(
      'INSERT INTO blogs (creator_user_id, creator_name, title, body, date_created) VALUES ($1,$2,$3,$4,NOW()) RETURNING *',
      [u.user_id, u.name, title, body]
    );
    res.status(201).json({ post: r.rows[0] });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.put('/api/posts/:id', authRequired, async (req, res) => {
  const { title, body } = req.body || {};
  const u = req.session.user;
  try {
    const b = await pool.query('SELECT * FROM blogs WHERE blog_id=$1', [req.params.id]);
    const post = b.rows[0];
    if (!post) return res.status(404).json({ error: 'not found' });
    if (post.creator_user_id !== u.user_id) return res.status(403).json({ error: 'forbidden' });
    const r = await pool.query(
      'UPDATE blogs SET title=$1, body=$2, date_updated=NOW() WHERE blog_id=$3 RETURNING *',
      [title ?? post.title, body ?? post.body, req.params.id]
    );
    res.json({ post: r.rows[0] });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.delete('/api/posts/:id', authRequired, async (req, res) => {
  const u = req.session.user;
  try {
    const b = await pool.query('SELECT * FROM blogs WHERE blog_id=$1', [req.params.id]);
    const post = b.rows[0];
    if (!post) return res.status(404).json({ error: 'not found' });
    if (post.creator_user_id !== u.user_id) return res.status(403).json({ error: 'forbidden' });
    await pool.query('DELETE FROM blogs WHERE blog_id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
