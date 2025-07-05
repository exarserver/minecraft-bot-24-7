const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

// Web server للحفاظ على الخدمة حية
app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    bot: bot && bot.entity ? 'connected' : 'connecting',
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// إعدادات البوت
let bot;

function createBot() {
  console.log('🔄 Creating bot...');
  
  bot = mineflayer.createBot({
    host: 'exarserver.aternos.me',
    port: 52206,
    username: 'serverexarbot',
    version: '1.21.4',
    auth: 'offline'
  });

  bot.once('spawn', () => {
    console.log('✅ Bot spawned!');
    bot.chat('Hello! Bot is online 24/7');
    startAntiAFK();
  });

  bot.on('error', (err) => {
    console.log('❌ Error:', err.message);
  });

  bot.on('end', () => {
    console.log('🔌 Disconnected, reconnecting...');
    setTimeout(createBot, 5000);
  });
}

function startAntiAFK() {
  setInterval(() => {
    if (bot && bot.entity) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 100);
    }
  }, 30000);
}

createBot();
console.log('🚀 Bot system started!');
