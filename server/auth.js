const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');
const crypto = require('crypto');

router.post('/api/logout', async (req, res) => {
  req.session.user = null;
  console.log('用户退出成功。');
  res.json({ status:true, message: '退出成功' }); 
});


router.post('/api/login', async (req, res) => {
  const { username, password, autologin } = req.body;
   
  try {
    // 这里添加实际的用户验证逻辑
    // 例如: 检查数据库中的用户名和密码
    let password2 = null;
    if(typeof autologin !== 'undefined' && autologin == 1){
      password2 = password;
    }else{
      password2 = crypto.createHash('md5').update(password).digest('hex');
    }
    db.get('SELECT * FROM user WHERE (username=? or mobile=? or email=?) and password = ?', [username, username, username, password2], (err, row) => {
    
      if (err) {
        return res.json({ status:false, message: err.message });
      }
      if(row){
        res.cookie('user', JSON.stringify(row));
        req.session.user = row;  
        return res.json({ status:true, data: row });
      }
      return res.json({ status:false, message: '用户名或密码错误' });
    });

  } catch (error) {
    res.json({
      status: false,
      message: '用户名或密码错误'
    });
  }
});
 
// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 设置上传目录
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    // 使用原始文件名和当前时间戳生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  }
});

// 创建 multer 实例
const upload = multer({ storage: storage });

// 图片上传接口
router.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '请上传图片文件' });
  }

  // 返回上传后的图片路径
  const imagePath = path.join('/uploads', req.file.filename); // 返回相对路径
  res.json({ imageUrl: imagePath });
});

module.exports = router; 