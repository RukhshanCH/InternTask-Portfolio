// Force load .env manually before anything else
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim(); // handle values with = in them
      if (value && !value.startsWith('#')) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── SCHEMAS ───

// Content Type = defines the structure of content (like a table schema)
const contentTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },      // e.g., "project", "blog-post", "skill"
  label: { type: String, required: true },                   // e.g., "Project", "Blog Post"
  fields: [{
    name: { type: String, required: true },                  // field key
    label: { type: String, required: true },                 // display label
    type: { type: String, enum: ['text', 'textarea', 'number', 'boolean', 'date', 'url', 'array', 'select', 'richtext', 'image'], required: true },
    required: { type: Boolean, default: false },
    options: [String],                                       // for select fields
    defaultValue: mongoose.Schema.Types.Mixed
  }],
  icon: { type: String, default: '📄' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Content = actual data entries
const contentSchema = new mongoose.Schema({
  contentType: { type: String, required: true, index: true }, // references contentType.name
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // dynamic fields
  slug: { type: String, index: true },                        // for URL routing
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pages = for custom page builder
const pageSchema = new mongoose.Schema({
  route: { type: String, required: true, unique: true },      // e.g., "/about", "/blog"
  title: { type: String, required: true },
  metaDescription: String,
  sections: [{
    contentType: String,
    contentId: mongoose.Schema.Types.ObjectId,
    order: Number
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const ContentType = mongoose.model('ContentType', contentTypeSchema);
const Content = mongoose.model('Content', contentSchema);
const Page = mongoose.model('Page', pageSchema);

// ─── SEED DEFAULT CONTENT TYPES ───
async function seedDefaults() {
  const types = [

    {
      name: 'theme',
      label: 'Theme',
      icon: '🎨',
      fields: [
        // === Theme Identity ===
        { name: 'name', label: 'Theme Name', type: 'text', defaultValue: 'Default' },
        { name: 'isActive', label: 'Active Theme', type: 'boolean', required: false, defaultValue: false },

        // === Core Palette ===
        { name: 'primary', label: 'Primary Color', type: 'text', defaultValue: '#3b82f6' },
        { name: 'primaryDark', label: 'Primary Dark', type: 'text', defaultValue: '#2563eb' },
        { name: 'secondary', label: 'Secondary Color', type: 'text', defaultValue: '#8b5cf6' },
        { name: 'accent', label: 'Accent Color', type: 'text', defaultValue: '#4ade80' },
        { name: 'accentSoft', label: 'Accent Soft', type: 'text', defaultValue: '#bbf7d0' },
        { name: 'accentBg', label: 'Accent Background', type: 'text', defaultValue: '#f0fdf4' },

        // === Semantic Colors ===
        { name: 'success', label: 'Success Color', type: 'text', defaultValue: '#22c55e' },
        { name: 'warning', label: 'Warning Color', type: 'text', defaultValue: '#f59e0b' },
        { name: 'danger', label: 'Danger Color', type: 'text', defaultValue: '#ef4444' },
        { name: 'featured', label: 'Featured Badge Color', type: 'text', defaultValue: '#fbbf24' },

        // === Neutral Scale ===
        { name: 'dark', label: 'Dark Color', type: 'text', defaultValue: '#1e1b4b' },
        { name: 'light', label: 'Light Color', type: 'text', defaultValue: '#ffffff' },
        { name: 'gray', label: 'Gray', type: 'text', defaultValue: '#e2e8f0' },
        { name: 'grayWarm', label: 'Gray Warm', type: 'text', defaultValue: '#f1f5f9' },
        { name: 'text', label: 'Text Color', type: 'text', defaultValue: '#334155' },
        { name: 'textLight', label: 'Text Light', type: 'text', defaultValue: '#64748b' },

        // === Layout & Typography ===
        { name: 'radius', label: 'Border Radius (px)', type: 'text', defaultValue: '12' },
        { name: 'maxWidth', label: 'Max Width (px)', type: 'text', defaultValue: '1200' },
        { name: 'fontFamily', label: 'Font Family', type: 'select', options: ['system', 'inter', 'roboto', 'poppins', 'montserrat'] },
        { name: 'gradientDirection', label: 'Gradient Direction', type: 'select', options: ['135deg', '90deg', '180deg', '45deg'] },

        // === Component Style ===
        { name: 'cardStyle', label: 'Card Style', type: 'select', options: ['rounded', 'sharp', 'glass'] },
        { name: 'buttonStyle', label: 'Button Style', type: 'select', options: ['gradient', 'solid', 'outline'] },

        // === Behavior ===
        { name: 'enableAnimations', label: 'Enable Animations', type: 'boolean', defaultValue: true },
        { name: 'darkMode', label: 'Dark Mode', type: 'boolean', defaultValue: false },
      ]
    },
    {
      name: 'hero',
      label: 'Hero',
      icon: '🏠',
      fields: [
        { name: 'greeting', label: 'Greeting', type: 'text', defaultValue: 'Hello, I am' },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'subtitle', label: 'Subtitle', type: 'textarea' },
        { name: 'buttons', label: 'Buttons', type: 'array' },
        { name: 'backgroungImage', label: 'Background Image', type: 'image' }
      ]
    },
    {
      name: 'about',
      label: 'About',
      icon: '👤',
      fields: [
        { name: 'heading', label: 'Heading', type: 'text', required: true, defaultValue: 'About Me' },
        { name: 'paragraphs', label: 'Paragraphs', type: 'array' },
        { name: 'stats', label: 'Stats', type: 'array' },
        { name: 'imageUrl', label: 'Profile Image', type: 'image' }
      ]
    },
    {
      name: 'project',
      label: 'Project',
      icon: '🚀',
      fields: [
        // Basic info
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          options: ['Web Development', 'Mobile App', 'AI/ML', 'Design', 'DevOps', 'Other']
        },
        { name: 'technologies', label: 'Technologies', type: 'array' },

        // Images grouped together
        { name: 'imageUrl', label: 'Image URL', type: 'image' },
        { name: 'images', label: 'Images', type: 'array' },

        // Project links
        { name: 'liveUrl', label: 'Live URL', type: 'url' },
        { name: 'githubUrl', label: 'GitHub URL', type: 'url' },

        // Display controls
        { name: 'featured', label: 'Featured', type: 'boolean', defaultValue: false },
        { name: 'order', label: 'Display Order', type: 'number', defaultValue: 0 },

        // Social URLs — all at the bottom
        { name: 'instaUrl', label: 'Instagram URL', type: 'url' },
        { name: 'fbUrl', label: 'Facebook URL', type: 'url' },
        { name: 'behanceUrl', label: 'Behance URL', type: 'url' },
        { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'url' },
        { name: 'redditUrl', label: 'Reddit URL', type: 'url' }
      ]
    },
    {
      name: 'skill',
      label: 'Skill',
      icon: '⭐',
      fields: [
        { name: 'name', label: 'Skill Name', type: 'text', required: true },
        { name: 'level', label: 'Level', type: 'text' },
        { name: 'percentage', label: 'Percentage', type: 'number', defaultValue: 75 },
        { name: 'order', label: 'Display Order', type: 'number', defaultValue: 0 }
      ]
    },
    {
      name: "contact",
      label: "Contact",
      icon: "📧",
      fields: [
        { name: "heading", label: "Heading", type: "text", required: true, defaultValue: "Get In Touch" },
        { name: "subheading", label: "Subheading", type: "textarea", defaultValue: "Have a project in mind? Let's work together." },
        { name: "email", label: "Email", type: "text", defaultValue: "alex@developer.com" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "location", label: "Location", type: "text", defaultValue: "San Francisco, CA" },
        { name: "linkedin", label: "LinkedIn URL", type: "url" },
        { name: "instagram", label: "Instagram URL", type: "url" },
        { name: "facebook", label: "Facebook URL", type: "url" },
        { name: "reddit", label: "Reddit URL", type: "url" },
        { name: "whatsapp", label: "Whatsapp Number", type: "text" },
        { name: "whatsappMessage", label: "Whatsapp Message", type: "text", defaultValue: "Hello, I would like to work with you." },
        { name: "formEnabled", label: "Enable Contact Form", type: "boolean", defaultValue: true }
      ]
    },
  ];

  const defaultThemes = [
    {
      contentType: 'theme',
      slug: 'default',
      status: 'published',
      order: 1,
      data: {
        name: 'Default',
        isActive: true,
        primary: '#3b82f6',
        primaryDark: '#2563eb',
        secondary: '#8b5cf6',
        accent: '#4ade80',
        accentSoft: '#a6ffc5',
        accentBg: '#f0fdf4',
        dark: '#1e1b4b',
        light: '#ffffff',
        gray: '#e2e8f0',
        grayWarm: '#f1f5f9',
        text: '#334155',
        textLight: '#64748b',
        radius: '12',
        maxWidth: '1200',
        fontFamily: 'system',
        gradientDirection: '135deg',
        cardStyle: 'rounded',
        buttonStyle: 'gradient',
        enableAnimations: true,
        darkMode: false,
        featured: true,
      }
    },
    {
      contentType: 'theme',
      slug: 'warm-sunset',
      status: 'published',
      order: 2,
      data: {
        name: 'Warm Sunset',
        isActive: false,
        primary: '#f97316',
        primaryDark: '#ea580c',
        secondary: '#db2777',
        accent: '#fbbf24',
        accentSoft: '#f8e38f',
        accentBg: '#fffbeb',
        dark: '#431407',
        light: '#fff7ed',
        gray: '#fed7aa',
        grayWarm: '#ffedd5',
        text: '#431407',
        textLight: '#9a3412',
        radius: '16',
        maxWidth: '1200',
        fontFamily: 'system',
        gradientDirection: '135deg',
        cardStyle: 'rounded',
        buttonStyle: 'gradient',
        enableAnimations: true,
        darkMode: false,
        featured: false,
      }
    },
    {
      contentType: 'theme',
      slug: 'forest-nature',
      status: 'published',
      order: 3,
      data: {
        name: 'Forest Nature',
        isActive: false,
        primary: '#15803d',
        primaryDark: '#166534',
        secondary: '#0d9488',
        accent: '#84cc16',
        accentSoft: '#e1fea7',
        accentBg: '#f0fdf4',
        dark: '#052e16',
        light: '#f7fee7',
        gray: '#bbf7d0',
        grayWarm: '#dcfce7',
        text: '#14532d',
        textLight: '#15803d',
        radius: '14',
        maxWidth: '1200',
        fontFamily: 'system',
        gradientDirection: '160deg',
        cardStyle: 'rounded',
        buttonStyle: 'solid',
        enableAnimations: true,
        darkMode: false,
        featured: false,
      }
    },
    {
      contentType: 'theme',
      slug: 'cyberpunk-dark',
      status: 'published',
      order: 4,
      data: {
        name: 'Cyberpunk Dark',
        isActive: false,
        primary: '#a855f7',
        primaryDark: '#7e22ce',
        secondary: '#06b6d4',
        accent: '#f472b6',
        accentSoft: '#fce7f3',
        accentBg: '#2e1065',
        dark: '#0f0f1a',
        light: '#1a1a2e',
        gray: '#2d2d44',
        grayWarm: '#252538',
        text: '#e2e8f0',
        textLight: '#94a3b8',
        radius: '8',
        maxWidth: '1280',
        fontFamily: 'system',
        gradientDirection: '145deg',
        cardStyle: 'glass',
        buttonStyle: 'glow',
        enableAnimations: true,
        darkMode: true,
        featured: false,
      }
    },
    {
      contentType: 'theme',
      slug: 'midnight-elegant',
      status: 'published',
      order: 5,
      data: {
        name: 'Midnight Elegant',
        isActive: false,
        primary: '#e2e8f0',
        primaryDark: '#cbd5e1',
        secondary: '#94a3b8',
        accent: '#fbbf24',
        accentSoft: '#fef3c7',
        accentBg: '#1e293b',
        dark: '#020617',
        light: '#0f172a',
        gray: '#334155',
        grayWarm: '#1e293b',
        text: '#f1f5f9',
        textLight: '#94a3b8',
        radius: '6',
        maxWidth: '1200',
        fontFamily: 'system',
        gradientDirection: '180deg',
        cardStyle: 'flat',
        buttonStyle: 'outline',
        enableAnimations: true,
        darkMode: true,
        featured: false,
      }
    }
  ];

  // Seed content types
  for (const type of types) {
    const existing = await ContentType.findOne({ name: type.name });
    if (!existing) {
      await ContentType.create(type);
    }
  }

  // Seed default themes
  for (const theme of defaultThemes) {
    const existing = await Content.findOne({ contentType: 'theme', slug: theme.slug });
    if (!existing) {
      await Content.create(theme);
    }
  }
}

// ─── MONGOOSE CONNECTION ───
async function startServer() {

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Seed after connection
    await seedDefaults();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

}

startServer();

// ─── MIDDLEWARE ───
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── CONTENT TYPE ROUTES ───

// Get all content types
app.get('/api/content-types', asyncHandler(async (req, res) => {
  const types = await ContentType.find({ isActive: true }).sort({ order: 1 });
  res.json(types);
}));

// Create content type
app.post('/api/content-types', asyncHandler(async (req, res) => {
  const type = await ContentType.create(req.body);
  res.status(201).json(type);
}));

// Update content type
app.put('/api/content-types/:id', asyncHandler(async (req, res) => {
  const type = await ContentType.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(type);
}));

// Delete content type
app.delete('/api/content-types/:id', asyncHandler(async (req, res) => {
  const name = (await ContentType.findById(req.params.id))?.name;
  if (name) await Content.deleteMany({ contentType: name });
  await ContentType.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}));

// ─── CONTENT ROUTES (Generic CRUD for any content type) ───

// Get content by type (with optional filters)
app.get('/api/content/:contentType', asyncHandler(async (req, res) => {
  const { contentType } = req.params;
  const { status = 'published', sort = 'createdAt', limit } = req.query;

  const query = { contentType };
  if (status !== 'all') query.status = status;

  let items;
  if (sort === 'order') {
    items = await Content.aggregate([
      { $match: query },
      { $addFields: { orderNum: { $toInt: { $ifNull: ['$data.order', 0] } } } },
      { $sort: { orderNum: 1, createdAt: -1 } }
    ]);
    if (limit) items = items.slice(0, Number(limit));
  } else {
    let q = Content.find(query).sort({ [sort]: 1 });
    if (limit) q = q.limit(Number(limit));
    items = await q;
  }

  res.json(items);
}));

// Get single content
app.get('/api/content/:contentType/:id', asyncHandler(async (req, res) => {
  const item = await Content.findOne({ contentType: req.params.contentType, _id: req.params.id });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

// Get content by slug
app.get('/api/content/:contentType/slug/:slug', asyncHandler(async (req, res) => {
  const item = await Content.findOne({ contentType: req.params.contentType, slug: req.params.slug });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

// Create content
app.post('/api/content/:contentType', asyncHandler(async (req, res) => {
  const contentType = await ContentType.findOne({ name: req.params.contentType });
  if (!contentType) return res.status(404).json({ error: 'Content type not found' });

  const item = await Content.create({
    contentType: req.params.contentType,
    data: req.body,
    slug: req.body.slug || req.body.title?.toLowerCase().replace(/\s+/g, '-'),
    status: req.body.status || 'published'
  });
  res.status(201).json(item);
}));

// Update content
app.put('/api/content/:contentType/:id', asyncHandler(async (req, res) => {
  const item = await Content.findOneAndUpdate(
    { contentType: req.params.contentType, _id: req.params.id },
    {
      data: req.body,
      slug: req.body.slug || req.body.title?.toLowerCase().replace(/\s+/g, '-'),
      status: req.body.status || 'published',
      updatedAt: new Date()
    },
    { new: true }
  );
  res.json(item);
}));

// Delete content
app.delete('/api/content/:contentType/:id', asyncHandler(async (req, res) => {
  await Content.findOneAndDelete({ contentType: req.params.contentType, _id: req.params.id });
  res.json({ message: 'Deleted' });
}));

// Bulk delete
app.post('/api/content/:contentType/bulk-delete', asyncHandler(async (req, res) => {
  await Content.deleteMany({ contentType: req.params.contentType, _id: { $in: req.body.ids } });
  res.json({ deleted: req.body.ids.length });
}));

// ─── PAGE ROUTES ───

app.get('/api/pages', asyncHandler(async (req, res) => {
  const pages = await Page.find({ isActive: true });
  res.json(pages);
}));

app.get('/api/pages/:route', asyncHandler(async (req, res) => {
  const page = await Page.findOne({ route: req.params.route });
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json(page);
}));

// ─── HEALTH ───
app.get('/', (req, res) => res.send('CMS Backend Running'));

const multer = require('multer');

// Create uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer
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
  res.json({
    url: `http://cms-portfolio-production-744c.up.railway.app/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
  });
});

// Optional: delete uploaded file
app.delete('/api/upload/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: 'Deleted' });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// GET active theme (featured = true)
app.get('/api/theme', asyncHandler(async (req, res) => {
  const theme = await Content.findOne({ contentType: 'theme', status: 'published', 'data.isActive': true });

  if (!theme) {
    // Fallback: return default theme
    return res.json({
      data: {
        primary: '#3b82f6',
        primaryDark: '#2563eb',
        secondary: '#8b5cf6',
        accent: '#4ade80',
        accentSoft: '#bbf7d0',
        accentBg: '#f0fdf4',
        dark: '#1e1b4b',
        light: '#ffffff',
        gray: '#e2e8f0',
        grayWarm: '#f1f5f9',
        text: '#334155',
        textLight: '#64748b',
        radius: '12',
        maxWidth: '1200',
        fontFamily: 'system',
        gradientDirection: '135deg',
        cardStyle: 'rounded',
        buttonStyle: 'gradient',
        enableAnimations: true,
        darkMode: false,
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        featured: '#fbbf24',
      }
    });
  }
  res.json(theme);
}));