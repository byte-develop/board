import fs from 'fs';
import path from 'path';

interface Config {
  server: {
    port: number;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  database: {
    type: string;
    ssl: boolean;
    maxConnections: number;
    idleTimeout: number;
  };
  session: {
    secret: string;
    name: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: string;
  };
  auth: {
    bcryptRounds: number;
    tokenExpiration: string;
  };
  app: {
    name: string;
    description: string;
    version: string;
  };
  features: {
    aiAssistant: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}

let config: Config;

try {
  const configPath = path.join(process.cwd(), 'config.json');
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configFile);
} catch (error) {
  console.error('Error loading config.json:', error);
  // Fallback to default config
  config = {
    server: {
      port: 5000,
      cors: {
        origin: ["http://localhost:3000", "http://localhost:5000"],
        credentials: true
      }
    },
    database: {
      type: "postgresql",
      ssl: true,
      maxConnections: 20,
      idleTimeout: 30000
    },
    session: {
      secret: process.env.SESSION_SECRET || "fallback-secret",
      name: "taskflow.sid",
      maxAge: 86400000,
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    },
    auth: {
      bcryptRounds: 12,
      tokenExpiration: "24h"
    },
    app: {
      name: "TaskFlow Pro",
      description: "Smart Project Management",
      version: "1.0.0"
    },
    features: {
      aiAssistant: true,
      notifications: false,
      analytics: true
    }
  };
}

// Override with environment variables if they exist
if (process.env.PORT) {
  config.server.port = parseInt(process.env.PORT);
}

if (process.env.SESSION_SECRET) {
  config.session.secret = process.env.SESSION_SECRET;
}

if (process.env.NODE_ENV === 'production') {
  config.session.secure = true;
  config.database.ssl = true;
}

export default config;