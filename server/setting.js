// server/setting.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const db = new sqlite3.Database('./database.db');

// 获取系统设置
router.get('/api/setting', (req, res) => {

  let user = req.session.user;
  if(!user ||!user.id){
      return res.json({status:false, message: 'login' });
  }

    let id = req.query.id || 1;
    db.get('SELECT * FROM setting WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.json({ status:false, message: err.message });
    }
    res.json({status:true, data:row});
  });

});

// 更新系统设置
router.post('/api/setting', (req, res) => {
  const { id, domain, model, prompt } = req.body;
  db.get('SELECT * FROM setting WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.json({ status:false, message: err.message });
    }
    if (!row) {
      db.run('INSERT INTO setting (id, domain, model, prompt) VALUES (?, ?, ?, ?)', [id, domain, model, prompt], function(err) {
        if (err) {
          return res.json({ status:false, message: err.message });
        }
        global.setting = { id, domain, model, prompt };
        res.json({status:true,  message: '系统设置新增成功' });
      });
    } else {
      db.run('UPDATE setting SET domain = ?, model = ?, prompt = ? WHERE id = ?', [domain, model, prompt, id], function(err) {
        if (err) {
          return res.json({ status:false, message: err.message });
        }
        global.setting = { id, domain, model, prompt };
        res.json({ status:true, message: '系统设置更新成功' });
      });
    }
  });

});

// 导出路由
module.exports = router;