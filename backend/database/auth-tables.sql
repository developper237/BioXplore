-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(30),
  password_hash VARCHAR(255),
  avatar_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  auth_provider VARCHAR(20) DEFAULT 'local' CHECK (auth_provider IN ('local', 'google', 'facebook')),
  oauth_id VARCHAR(255),
  terms_accepted_at TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifs BOOLEAN DEFAULT true,
  promo_notifs BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password resets
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);