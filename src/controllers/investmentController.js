const db = require('../config/database');

// Get all investments
exports.getInvestments = (req, res) => {
  const userId = req.user.userId;

  db.all(
    'SELECT * FROM investments WHERE user_id = ? ORDER BY purchase_date DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ investments: rows || [] });
    }
  );
};

// Create investment
exports.createInvestment = (req, res) => {
  const userId = req.user.userId;
  const { 
    name, asset_type, risk_level, principal_amount, 
    current_value, currency, purchase_date, provider, notes 
  } = req.body;

  if (!name || !asset_type || !risk_level || !principal_amount || !current_value || !currency || !purchase_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO investments 
     (user_id, name, asset_type, risk_level, principal_amount, current_value, currency, purchase_date, provider, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, asset_type, risk_level, principal_amount, current_value, currency, purchase_date, provider || null, notes || null],
    function(err) {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ error: 'Failed to create investment' });
      }

      db.get(
        'SELECT * FROM investments WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ 
            message: 'Investment created successfully',
            investment: row 
          });
        }
      );
    }
  );
};

// Update investment
exports.updateInvestment = (req, res) => {
  const userId = req.user.userId;
  const investmentId = req.params.id;
  const { current_value } = req.body;

  db.run(
    `UPDATE investments 
     SET current_value = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [current_value, investmentId, userId],
    function(err) {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ error: 'Failed to update investment' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Investment not found' });
      }

      res.json({ message: 'Investment updated successfully' });
    }
  );
};

// Delete investment
exports.deleteInvestment = (req, res) => {
  const userId = req.user.userId;
  const investmentId = req.params.id;

  db.run(
    'DELETE FROM investments WHERE id = ? AND user_id = ?',
    [investmentId, userId],
    function(err) {
      if (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ error: 'Failed to delete investment' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Investment not found' });
      }

      res.json({ message: 'Investment deleted successfully' });
    }
  );
};

// Get portfolio statistics
exports.getPortfolioStats = (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT 
      SUM(principal_amount) as total_invested,
      SUM(current_value) as total_value,
      SUM(current_value - principal_amount) as total_gain_loss,
      COUNT(*) as investment_count
    FROM investments 
    WHERE user_id = ?
  `;

  db.get(query, [userId], (err, stats) => {
    if (err) {
      console.error('Statistics error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      statistics: {
        totalInvested: stats.total_invested || 0,
        totalValue: stats.total_value || 0,
        totalGainLoss: stats.total_gain_loss || 0,
        investmentCount: stats.investment_count || 0
      }
    });
  });
};
