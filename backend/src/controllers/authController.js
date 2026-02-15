const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fint26-mr-tony-super-secret-key-2026';

// Register new user
exports.register = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    db.get(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()],
      async (err, existing) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (existing) {
          return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        db.run(
          `INSERT INTO users (email, password_hash, name)
           VALUES (?, ?, ?)`,
          [email.toLowerCase(), passwordHash, name],
          function(err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({ error: 'Registration failed' });
            }

            const userId = this.lastID;

            // Generate token
            const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

            res.status(201).json({
              message: 'User registered successfully',
              user: {
                id: userId,
                email: email.toLowerCase(),
                name,
              },
              accessToken: token,
              refreshToken: token, // Same for now
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get(
    'SELECT id, email, password_hash, name FROM users WHERE email = ?',
    [email.toLowerCase()],
    async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken: token,
        refreshToken: token, // Same for now
      });
    }
  );
};

// Get current user
exports.getCurrentUser = (req, res) => {
  db.get(
    'SELECT id, email, name, created_at FROM users WHERE id = ?',
    [req.user.userId],
    (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    }
  );
};

// Delete user account
exports.deleteUser = (req, res) => {
  const userId = req.user.userId;

  db.run(
    'DELETE FROM users WHERE id = ?',
    [userId],
    function(err) {
      if (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ error: 'Failed to delete user' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User account deleted successfully' });
    }
  );
};