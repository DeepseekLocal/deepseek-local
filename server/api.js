// server/setting.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const db = new sqlite3.Database('./database.db');

// 获取历史会话
router.get('/api/conversations', (req, res) => {
  let user = req.session.user;
  if(!user ||!user.id){
      return res.json({status:false, message: 'login' });
  }
    let page = req.query.page || 1;
    let size = req.query.size || 20;
    let offset = (page - 1) * size;
    let sql = 'SELECT * FROM conversation where createby=? ORDER BY id DESC LIMIT ?, ?';
    db.all(sql, [user.id, offset, size], (err, rows) => {
        if (err) {
            return res.json({ status:false, message: err.message });
        }
 
        res.json({status: true, data: rows });
  });
});

// 保存会话
router.post('/api/saveConversation', (req, res) => {
    const { id, title } = req.body;
    let user = req.session.user;
    if(!user ||!user.id){
        return res.json({status:false, message: 'login' });
    }

    const createat = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if(id){
        db.run('UPDATE conversation SET title = ? WHERE id = ?',
            [title, id],
            (err) => {
              if (err) {
                return res.json({ status:false, message: err.message });
              }
              res.json({ status: true, data: {id, title} });
            }
          );
    }else{
        db.run('INSERT INTO conversation (title, createat, createby) VALUES (?, ?, ?)',
            [title, createat, user.id],
            function(err) {
              if (err) {
                res.json({ status:false, message: err.message });
                return;
              }
              res.json({ status:true, data:{ id: this.lastID, title: title} });
            }
          );
    }
    
});

router.post('/api/renameConversation', (req, res) => {
  const { id, title } = req.body;
  db.run('UPDATE conversation SET title = ?  WHERE id = ?',
    [title, id],
    (err) => {
      if (err) {
        res.json({ status:false, message: err.message });
        return;
      }
      res.json({ status: true, data: {id:id, title:title} });
    }
  );
});

router.post('/api/deleteConversation', (req, res) => {
  const { id } = req.body;
  db.run('delete from conversation WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        res.json({ status:false, message: err.message });
        return;
      }
      res.json({ status: true, data: id});
    }
  );
});

// 添加聊天
router.post('/api/addChat', (req, res) => {
    const { conversation_id, ask } = req.body;
    let user = req.session.user;
    if(!user ||!user.id){
        return res.json({status:false, message: 'login' });
    }

    const createat = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.run('INSERT INTO chat (conversation_id, ask, answer, status, createat, createby) VALUES (?, ?, ?, ?, ?, ?)',
    [conversation_id, ask, '', '0', createat, user.id],
    function(err) {
      if (err) {
        res.json({ status:false, message: err.message });
        return;
      }
      res.json({ status:true, data:{ id: this.lastID, conversation_id: conversation_id, ask:ask} });
    }
  );
    
});


// 修改聊天
router.post('/api/updateChat', (req, res) => {
    const { id, answer } = req.body;
    db.run('UPDATE chat SET answer = ?, status = ? WHERE id = ?',
      [answer, answer?'2':'1', id],
      (err) => {
        if (err) {
          res.json({ status:false, message: err.message });
          return;
        }
        res.json({ status: true, data: {id:id, answer:answer} });
      }
    );
    
});

// 获取历史会话
router.get('/api/chats', (req, res) => {
  let user = req.session.user;
  if(!user ||!user.id){
      return res.json({status:false, message: 'login' });
  }

    let conversation_id = req.query.conversation_id || 0;
    let page = req.query.page || 1;
    let size = req.query.size || 20;
    let offset = (page - 1) * size;
    let sql = 'SELECT * FROM chat where conversation_id=? and createby=? ORDER BY id DESC LIMIT ?, ?';
    db.all(sql, [conversation_id, user.id, offset, size], (err, rows) => {
        if (err) {
            return res.json({ status:false, message: err.message });
        }
      
        res.json({status: true, data: rows });
  });
});


router.post('/chat/completions', async (req, res) => {
   
  let model = req.body.model || global.setting.model;
  let domain = req.body.domain || global.setting.domain;
  let messages = req.body.messages || [];

  if(model.indexOf('gpt-')>-1){
    model = global.setting.model;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const response = await fetch(domain+'/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      stream: true
    })
  });

  // if (!response.ok) {
  //   throw new Error('Network response was not ok');
  // }
 

  // 创建响应流的读取器和解码器
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let responseText = '';

  try {
    let think = 0;
    while (true) {
      const { done, value } = await reader.read();
 
      if (done) {
        break;
      }
      
      // 确保 value 是 Uint8Array 类型
      if (value instanceof Uint8Array) {
        const chunk = decoder.decode(value, { stream: true });
 
        res.write(`data: ${chunk}\n\n`);
      }
    }
 
  } finally {
    // 确保最后的数据块被正确解码
    const finalChunk = decoder.decode();
    if (finalChunk) {
      res.write(`data: ${finalChunk}\n\n`);
    }
    res.end();
  }


});

// 导出路由
module.exports = router;