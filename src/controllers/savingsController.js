const db = require('../config/database');

// Get all savings goals
exports.getSavingsGoals = (req, res) => {
  const userId = req.user.userId;

  db.all(
    'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ savingsGoals: rows || [] });
    }
  );
};

// Create savings goal
exports.createSavingsGoal = (req, res) => {
  const userId = req.user.userId;
  const { name, target_amount, current_amount, currency, deadline, description } = req.body;

  if (!name || !target_amount || !currency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO savings_goals 
     (user_id, name, target_amount, current_amount, currency, deadline, description) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, target_amount, current_amount || 0, currency, deadline || null, description || null],
    function(err) {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ error: 'Failed to create savings goal' });
      }

      db.get(
        'SELECT * FROM savings_goals WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ 
            message: 'Savings goal created successfully',
            savingsGoal: row 
          });
        }
      );
    }
  );
};

// Update savings goal
exports.updateSavingsGoal = (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;
  const { current_amount } = req.body;

  db.run(
    `UPDATE savings_goals 
     SET current_amount = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [current_amount, goalId, userId],
    function(err) {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ error: 'Failed to update savings goal' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Savings goal not found' });
      }

      res.json({ message: 'Savings goal updated successfully' });
    }
  );
};

// Delete savings goal
exports.deleteSavingsGoal = (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;

  db.run(
    'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
    [goalId, userId],
    function(err) {
      if (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ error: 'Failed to delete savings goal' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Savings goal not found' });
      }

      res.json({ message: 'Savings goal deleted successfully' });
    }
  );
};