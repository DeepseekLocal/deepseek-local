// app.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser'); // 引入 body-parser
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db'); 
const app = express();

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// 1. 首先处理静态文件
app.use(express.static(path.join(process.cwd(), 'dist')));

// 4. API 路由注册
app.use('/', require('./server/auth'));
app.use('/', require('./server/conversation'));
app.use('/', require('./server/chat'));
app.use('/', require('./server/user'));
app.use('/', require('./server/setting'));
app.use('/', require('./server/api'));

// 5. 处理所有其他请求，返回前端的 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// 定义全局设置变量
global.setting = null;

// 初始化系统设置
async function initSetting() {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM setting WHERE id = 1', [], (err, row) => {
            if (err) {
                console.error('初始化系统设置失败:', err);
                reject(err);
                return;
            }
            global.setting = row;
            console.log('系统设置已加载');
            resolve(row);
        });
    });
}

// 启动服务器
const port = 8888;
app.listen(port, async () => {
  await initSetting();
  console.log(`服务器正在运行在 http://localhost:${port}`);
});

