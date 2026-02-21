const { supabase } = require('../config/supabase');
const bcrypt = require('bcrypt');

// GET /api/profile
async function getProfile(req, res) {
  try {
    const userId = req.user.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, role, created_at, last_login')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('❌ User not found:', error);
      return res.status(404).json({ success: false, message: 'User not found', detail: error?.message });
    }

    // Construire full_name côté serveur
    user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim();

    return continueProfile(res, userId, user);

  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error', detail: error.message });
  }
}

async function continueProfile(res, userId, user) {
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    res.json({
      success: true,
      data: { user, address: address || null, settings: settings || null }
    });
}

// PUT /api/profile
async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, email, phone } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone
      })
      .eq('id', userId)
      .select('id, first_name, last_name, email, phone, role, created_at, last_login')
      .single();

    if (error) throw error;
    user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim();

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// PUT /api/profile/address
async function updateAddress(req, res) {
  try {
    const userId = req.user.userId;
    const { street, city, state, zipCode, country } = req.body;

    // Vérifier si une adresse existe déjà
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', userId)
      .single();

    let address;

    if (existing) {
      const { data, error } = await supabase
        .from('addresses')
        .update({ street, city, state, zip_code: zipCode, country, is_default: true })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      address = data;
    } else {
      const { data, error } = await supabase
        .from('addresses')
        .insert({ user_id: userId, street, city, state, zip_code: zipCode, country, is_default: true })
        .select()
        .single();
      if (error) throw error;
      address = data;
    }

    res.json({ success: true, data: address });
  } catch (error) {
    console.error('updateAddress error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// PUT /api/profile/settings
async function updateSettings(req, res) {
  try {
    const userId = req.user.userId;
    const { emailNotifs, promoNotifs, twoFactorEnabled } = req.body;

    const { data, error } = await supabase
      .from('user_settings')
      .update({
        email_notifs: emailNotifs,
        promo_notifs: promoNotifs,
        two_factor_enabled: twoFactorEnabled
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('updateSettings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// PUT /api/profile/password
async function updatePassword(req, res) {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('updatePassword error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getProfile, updateProfile, updateAddress, updateSettings, updatePassword };