// server/chat.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const router = express.Router();
const db = new sqlite3.Database('./database.db');
 
// 添加聊天记录
router.post('/api/chat', (req, res) => {
  const { conversation_id, ask, answer, status, createby } = req.body;
  const createat = new Date().toISOString().slice(0, 19).replace('T', ' ');

  db.run('INSERT INTO chat (conversation_id, ask, answer, status, createat, createby) VALUES (?, ?, ?, ?, ?, ?)',
    [conversation_id, ask, answer, status, createat, createby],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// 获取聊天记录（带分页）
router.get('/api/chat', (req, res) => {

  let user = req.session.user;
  if(!user ||!user.id){
      return res.json({status:false, message: 'login' });
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const conversation_id = req.query.conversation_id || '';
  const ask = req.query.ask || '';
  const answer = req.query.answer || '';
  const status = req.query.status || '';
  const createat = req.query.createat || '';
  const id = req.query.id || '';

  let whereClause = '';
  let params = [];

  if (id) {
    whereClause += ' AND id = ?';
    params.push(id);
  }
  if (conversation_id) {
    whereClause += ' AND conversation_id = ?';
    params.push(conversation_id);
  }
  if (ask) {
    whereClause += ' AND ask LIKE ?';
    params.push(`%${ask}%`);
  }
  if (answer) {
    whereClause += ' AND answer LIKE ?';
    params.push(`%${answer}%`);
  }
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (createat) {
    whereClause += ' AND createat LIKE ?';
    params.push(`%${createat}%`);
  }

  // 获取总数
  db.get(`SELECT COUNT(*) as total FROM chat WHERE 1=1 ${whereClause}`, params, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // 获取分页数据
    db.all(
      `SELECT * FROM chat WHERE 1=1 ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({
          status:true,
          total: row.total,
          data: rows,
          page,
          pageSize
        });

      }
    );
  });
});

// 更新聊天记录
router.put('/api/chat/:id', (req, res) => {
  const { conversation_id, ask, answer, status } = req.body;

  db.run('UPDATE chat SET conversation_id = ?, ask = ?, answer = ?, status = ? WHERE id = ?',
    [conversation_id, ask, answer, status, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// 删除聊天记录
router.delete('/api/chat/:id', (req, res) => {
  db.run('DELETE FROM chat WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

module.exports = router; 