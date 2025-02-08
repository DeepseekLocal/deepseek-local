// server/conversation.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const router = express.Router();
const db = new sqlite3.Database('./database.db');

// 添加对话记录
router.post('/api/conversation', (req, res) => {
  const { title, createby } = req.body;
  const createat = new Date().toISOString().slice(0, 19).replace('T', ' ');

  db.run('INSERT INTO conversation (title, createat, createby) VALUES (?, ?, ?)',
    [title, createat, createby],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// 获取对话记录（带分页）
router.get('/api/conversation', (req, res) => {

  let user = req.session.user;
  if(!user ||!user.id){
      return res.json({status:false, message: 'login' });
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const id = req.query.id || '';
  const title = req.query.title || '';
  const createat = req.query.createat || '';

  let whereClause = '';
  let params = [];

  if (id) {
    whereClause += ' AND id = ?';
    params.push(`${id}`);
  }
  if (title) {
    whereClause += ' AND title LIKE ?';
    params.push(`%${title}%`);
  }
  if (createat) {
    whereClause += ' AND createat LIKE ?';
    params.push(`%${createat}%`);
  }

  // 获取总数
  db.get(`SELECT COUNT(*) as total FROM conversation WHERE 1=1 ${whereClause}`, params, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // 获取分页数据
    db.all(
      `SELECT * FROM conversation WHERE 1=1 ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
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

// 更新对话记录
router.put('/api/conversation/:id', (req, res) => {
  const { title } = req.body;

  db.run('UPDATE conversation SET title = ? WHERE id = ?',
    [title, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// 删除对话记录
router.delete('/api/conversation/:id', (req, res) => {
  db.run('DELETE FROM conversation WHERE id = ?',
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
