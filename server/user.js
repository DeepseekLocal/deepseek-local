// server/user.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const router = express.Router();
const db = new sqlite3.Database('./database.db');
const crypto = require('crypto');

// 中间件
//app.use(cors());
//app.use(express.json());


// 添加用户记录
router.post('/api/user', (req, res) => {
  const { username, password, status, role, mobile, email, photo, appid, openid, createby } = req.body;
  const createat = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
  let password2 = crypto.createHash('md5').update(password).digest('hex');

  db.run('INSERT INTO user (username, password, status, role, mobile, email, photo, appid, openid, createat, createby) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [username, password2, status, role, mobile, email, photo, appid, openid, createat, createby],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// 获取用户记录（带分页）
router.get('/api/user', (req, res) => {

  let user = req.session.user;
 
  if(!user ||!user.id){
      return res.json({status:false, message: 'login' });
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const username = req.query.username || '';
  const role = req.query.role || '';
  const status = req.query.status || '';
  const createat = req.query.createat || '';
  const id = req.query.id || '';

  let whereClause = '';
  let params = [];

  if (id) {
    whereClause += ' AND id = ?';
    params.push(`${id}`);
  }
  if (username) {
    whereClause += ' AND username LIKE ?';
    params.push(`%${username}%`);
  }

  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
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
  db.get(`SELECT COUNT(*) as total FROM user WHERE 1=1 ${whereClause}`, params, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // 获取分页数据
    db.all(
      `SELECT * FROM user WHERE 1=1 ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
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

// 更新用户记录
router.put('/api/user/:id', (req, res) => {
  const { username, password, status, role, mobile, email, photo, appid, openid } = req.body;
  let password2 = crypto.createHash('md5').update(password).digest('hex');
  db.run('UPDATE user SET username = ?, password = ?, status = ?, role = ?, mobile = ?, email = ?, photo = ?, appid = ?, openid = ? WHERE id = ?',
    [username, password2, status, role, mobile, email, photo, appid, openid, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// 删除用户记录
router.delete('/api/user/:id', (req, res) => {
  db.run('DELETE FROM user WHERE id = ?',
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