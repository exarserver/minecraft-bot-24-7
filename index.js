const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

// Web server
app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    bot: bot && bot.entity ? 'connected' : 'connecting',
    uptime: process.uptime(),
    server: 'exarserver.aternos.me:52206'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

let bot;

function createBot() {
  console.log('🔄 Creating bot...');
  console.log('📡 Target server: exarserver.aternos.me:52206');
  console.log('👤 Bot username: serverexarbot');
  
  try {
    bot = mineflayer.createBot({
      host: 'exarserver.aternos.me',
      port: 52206,
      username: 'serverexarbot',
      version: false, // كشف تلقائي      auth: 'offline',
      verbose: true // تفعيل الرسائل التفصيلية
    });

    // تتبع كل مراحل الاتصال
    bot._client.on('connect', () => {
      console.log('✅ TCP connected!');
    });

    bot._client.on('error', (err) => {
      console.error('❌ Connection error:', err);
    });

    bot._client.on('end', (reason) => {
      console.log('🔌 Connection ended:', reason);
    });

    bot.on('login', () => {
      console.log('✅ Logged in!');
    });

    bot.on('spawn', () => {
      console.log('🎉 Bot spawned successfully!');
      bot.chat('Bot online 24/7!');
      startAntiAFK();
    });

    bot.on('kicked', (reason) => {
      console.log('⚠️ Kicked:', reason);
    });

    bot.on('error', (err) => {
      console.error('❌ Bot error:', err);
    });

    bot.on('end', () => {
      console.log('🔌 Bot disconnected, reconnecting in 5s...');
      setTimeout(createBot, 5000);
    });

    // Timeout check
    setTimeout(() => {
      if (!bot || !bot.entity) {
        console.log('⏱️ Connection timeout after 30s');
        console.log('💡 Possible issues:');
        console.log('   1. Server is offline');
        console.log('   2. Port 52206 is closed');
        console.log('   3. Whitelist blocking');
        console.log('   4. Server mods blocking bots');
      }
    }, 30000);

  } catch (error) {
    console.error('❌ Failed to create bot:', error);
  }
}

function startAntiAFK() {
  console.log('🤖 Anti-AFK started');
  setInterval(() => {
    if (bot && bot.entity) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 100);
    }
  }, 30000);
}

createBot();
console.log('🚀 Bot system started!');
