const bcrypt = require('bcrypt');
const { supabase } = require('../config/supabase');
const { 
  generateAccessToken, 
  generateRefreshToken,
  getTokenExpiration,
  JWT_REFRESH_EXPIRES_IN 
} = require('../utils/jwt');

async function register(req, res) {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if email exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user (UUID généré automatiquement)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`, // Pour compatibilité
        email: email.toLowerCase(),
        phone,
        password_hash: hashedPassword,
        auth_provider: 'local',
        role: 'user',
        terms_accepted_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    
    // Create user settings
    await supabase.from('user_settings').insert({
      user_id: user.id
    });
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token
    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: getTokenExpiration(JWT_REFRESH_EXPIRES_IN)
    });
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }
    
    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user has password (not OAuth)
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Please login with ' + (user.auth_provider || 'OAuth')
      });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token
    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: getTokenExpiration(JWT_REFRESH_EXPIRES_IN)
    });
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('token', refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return res.json({
        success: true,
        message: 'If this email exists, a reset link has been sent.'
      });
    }

    // Generate a simple reset token (in production use crypto.randomBytes)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await supabase.from('password_resets').upsert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false
    });

    // In production, send email here. For now, log the reset link.
    console.log(`🔑 Password reset link for ${email}: http://localhost:5500/reset-password.html?token=${resetToken}`);

    res.json({
      success: true,
      message: 'If this email exists, a reset link has been sent.'
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { register, login, logout, forgotPassword };