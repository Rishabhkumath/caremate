const defaultOrigins = [
  'https://localhost',
  'capacitor://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'https://caremate001.vercel.app'
];

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...configuredOrigins, ...defaultOrigins])];

const isAllowedVercelPreview = (origin) => {
  if (process.env.ALLOW_VERCEL_PREVIEWS !== 'true') {
    return false;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests like Postman (no origin)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },

  credentials: true,
  optionsSuccessStatus: 200,

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ]
};

module.exports = corsOptions;
