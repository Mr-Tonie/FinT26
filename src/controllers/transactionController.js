const db = require('../config/database');

// Get all transactions
exports.getTransactions = (req, res) => {
  const userId = req.user.userId;

  db.all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ transactions: rows || [] });
    }
  );
};

// Create transaction
exports.createTransaction = (req, res) => {
  const userId = req.user.userId;
  const { date, description, amount, currency, category, payment_method, notes } = req.body;

  if (!date || !description || !amount || !currency || !category || !payment_method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO transactions 
     (user_id, date, description, amount, currency, category, payment_method, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, date, description, amount, currency, category, payment_method, notes || null],
    function(err) {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ error: 'Failed to create transaction' });
      }

      db.get(
        'SELECT * FROM transactions WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ 
            message: 'Transaction created successfully',
            transaction: row 
          });
        }
      );
    }
  );
};

// Delete transaction
exports.deleteTransaction = (req, res) => {
  const userId = req.user.userId;
  const transactionId = req.params.id;

  db.run(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [transactionId, userId],
    function(err) {
      if (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ error: 'Failed to delete transaction' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ message: 'Transaction deleted successfully' });
    }
  );
};

// Get statistics
exports.getStatistics = (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT 
      SUM(CASE WHEN category LIKE 'income_%' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN category LIKE 'expense_%' THEN amount ELSE 0 END) as total_expenses,
      COUNT(*) as transaction_count
    FROM transactions 
    WHERE user_id = ?
  `;

  db.get(query, [userId], (err, stats) => {
    if (err) {
      console.error('Statistics error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const netCashflow = (stats.total_income || 0) - (stats.total_expenses || 0);

    res.json({
      statistics: {
        totalIncome: stats.total_income || 0,
        totalExpenses: stats.total_expenses || 0,
        netCashflow,
        transactionCount: stats.transaction_count || 0
      }
    });
  });
};