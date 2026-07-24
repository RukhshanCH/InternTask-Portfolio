// ============================================
// Portfolio CMS Backend — Supabase Option 1
// Minimal Express server for uploads + admin auth
// All data operations moved to Supabase client in React
// ============================================

const fs = require('fs');
const path = require('path');

// Force load .env manually before anything else
const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (value && !value.startsWith('#')) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// ─── SUPABASE CLIENT ───
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── FILE UPLOADS (Multer → local, then optionally Supabase Storage) ───
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
  res.json({
    url: `${baseUrl}/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
  });
});

// Delete uploaded file
app.delete('/api/upload/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: 'Deleted' });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// ─── ADMIN AUTH (Simple password gate for /admin panel) ───
// NOTE: For production, migrate to Supabase Auth
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  // Check against admin_users table in Supabase
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Compare password (using bcrypt in production — install bcryptjs)
  // const bcrypt = require('bcryptjs');
  // const valid = await bcrypt.compare(password, admin.password_hash);

  // Simple comparison for now (MIGRATE TO BCRYPT!)
  const valid = password === admin.password_hash; // TEMPORARY — use bcrypt!

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update last login
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', admin.id);

  res.json({ 
    success: true, 
    token: 'admin-session-token', // In production, use JWT
    admin: { id: admin.id, username: admin.username }
  });
});

// ─── SEED DEFAULT DATA ───
// Run once to populate Supabase tables with default themes
async function seedDefaults() {
  // Check if themes already exist
  const { data: existingThemes } = await supabase
    .from('themes')
    .select('id')
    .limit(1);

  if (existingThemes && existingThemes.length > 0) {
    console.log('✅ Data already seeded');
    return;
  }

  const defaultThemes = [
    {
      name: 'Default',
      is_active: true,
      color_primary: '#3b82f6',
      color_secondary: '#8b5cf6',
      color_background: '#ffffff',
      color_surface: '#f8fafc',
      color_text: '#334155',
      color_text_muted: '#64748b',
      color_success: '#22c55e',
      color_warning: '#f59e0b',
      color_danger: '#ef4444',
      color_featured: '#fbbf24',
      font_family: 'system',
      border_radius: '12',
      max_width: '1200',
      card_style: 'rounded',
      button_style: 'gradient',
      enable_animations: true,
      dark_mode: false,
    },
    {
      name: 'Warm Sunset',
      is_active: false,
      color_primary: '#f97316',
      color_secondary: '#db2777',
      color_background: '#fff7ed',
      color_surface: '#ffedd5',
      color_text: '#431407',
      color_text_muted: '#9a3412',
      color_success: '#22c55e',
      color_warning: '#f59e0b',
      color_danger: '#ef4444',
      color_featured: '#fbbf24',
      font_family: 'system',
      border_radius: '16',
      max_width: '1200',
      card_style: 'rounded',
      button_style: 'gradient',
      enable_animations: true,
      dark_mode: false,
    },
    {
      name: 'Forest Nature',
      is_active: false,
      color_primary: '#15803d',
      color_secondary: '#0d9488',
      color_background: '#f7fee7',
      color_surface: '#dcfce7',
      color_text: '#14532d',
      color_text_muted: '#15803d',
      color_success: '#22c55e',
      color_warning: '#f59e0b',
      color_danger: '#ef4444',
      color_featured: '#84cc16',
      font_family: 'system',
      border_radius: '14',
      max_width: '1200',
      card_style: 'rounded',
      button_style: 'solid',
      enable_animations: true,
      dark_mode: false,
    },
    {
      name: 'Cyberpunk Dark',
      is_active: false,
      color_primary: '#a855f7',
      color_secondary: '#06b6d4',
      color_background: '#0f0f1a',
      color_surface: '#1a1a2e',
      color_text: '#e2e8f0',
      color_text_muted: '#94a3b8',
      color_success: '#22c55e',
      color_warning: '#f59e0b',
      color_danger: '#ef4444',
      color_featured: '#f472b6',
      font_family: 'system',
      border_radius: '8',
      max_width: '1280',
      card_style: 'glass',
      button_style: 'glow',
      enable_animations: true,
      dark_mode: true,
    },
    {
      name: 'Midnight Elegant',
      is_active: false,
      color_primary: '#e2e8f0',
      color_secondary: '#94a3b8',
      color_background: '#020617',
      color_surface: '#0f172a',
      color_text: '#f1f5f9',
      color_text_muted: '#94a3b8',
      color_success: '#22c55e',
      color_warning: '#f59e0b',
      color_danger: '#ef4444',
      color_featured: '#fbbf24',
      font_family: 'system',
      border_radius: '6',
      max_width: '1200',
      card_style: 'flat',
      button_style: 'outline',
      enable_animations: true,
      dark_mode: true,
    }
  ];

  const { error } = await supabase.from('themes').insert(defaultThemes);
  if (error) console.error('❌ Error seeding themes:', error);
  else console.log('✅ Default themes seeded');

  // Seed site settings
  const { error: settingsError } = await supabase.from('site_settings').insert({
    site_title: 'My Portfolio',
    site_description: 'A showcase of my work and skills.',
    nav_order: ['hero', 'about', 'skills', 'projects', 'contact'],
  });
  if (settingsError) console.error('❌ Error seeding settings:', settingsError);
  else console.log('✅ Site settings seeded');

  // Seed contact
  const { error: contactError } = await supabase.from('contact').insert({
    email: 'hello@example.com',
    form_enabled: true,
    whatsapp_default_message: 'Hello, I would like to work with you.',
  });
  if (contactError) console.error('❌ Error seeding contact:', contactError);
  else console.log('✅ Contact config seeded');
}

// ─── START SERVER ───
async function startServer() {
  try {
    // Seed defaults
    await seedDefaults();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ CMS Backend running on port ${PORT}`);
      console.log(`📁 Uploads served at: http://localhost:${PORT}/uploads`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  }
}

startServer();

// ─── HEALTH ───
app.get('/', (req, res) => res.send('CMS Backend Running (Supabase Mode)'));