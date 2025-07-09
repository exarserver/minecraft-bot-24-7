const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

// Web server
app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    bot: bot && bot.entity ? 'connected' : 'connecting',
    uptime: process.uptime(),
    server: 'og_players11.aternos.me:39617',
    lastError: lastError || null,
    connectionAttempts: connectionAttempts
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

let bot;
let lastError = null;
let connectionAttempts = 0;

function createBot() {
  connectionAttempts++;
  console.log(`🔄 Creating bot... (Attempt ${connectionAttempts})`);
  
  // إضافة timeout للاتصال
  const connectionTimeout = setTimeout(() => {
    console.log('⏰ Connection timeout - taking too long to connect');
    if (bot) {
      bot.end();
    }
  }, 30000); // 30 ثانية timeout

  bot = mineflayer.createBot({
    host: 'og_players11.aternos.me',
    port: 39617,
    username: 'server24h',
    version: '1.21.1',
    auth: 'offline'
  });

  // مسح timeout عند النجاح
  bot.once('spawn', () => {
    clearTimeout(connectionTimeout);
    console.log('✅ Bot spawned successfully!');
    console.log(`📍 Position: ${bot.entity.position}`);
    console.log(`🎮 Game mode: ${bot.game.gameMode}`);
    console.log(`🌍 Dimension: ${bot.game.dimension}`);
    
    bot.chat('Hello! Bot is online 24/7');
    startAntiAFK();
    connectionAttempts = 0; // إعادة تعيين العداد عند النجاح
  });

  // قبول Resource Pack تلقائياً
  bot._client.on('resource_pack_send', (packet) => {
    console.log('📦 Resource Pack detected!');
    try {
      bot._client.write('resource_pack_receive', {
        result: 0 // 0 = successfully loaded
      });
      console.log('✅ Resource Pack accepted!');
    } catch (err) {
      console.log('❌ Error accepting resource pack:', err.message);
    }
  });

  // طريقة بديلة
  bot.on('resourcePack', (url, hash) => {
    console.log('📦 Accepting resource pack...');
    try {
      if (bot.acceptResourcePack) {
        bot.acceptResourcePack();
      }
    } catch (err) {
      console.log('❌ Error with resource pack:', err.message);
    }
  });

  // معالجة أفضل للأخطاء
  bot.on('error', (err) => {
    clearTimeout(connectionTimeout);
    lastError = err.message;
    console.log('❌ Bot Error:', err.message);
    
    // أخطاء شائعة وحلولها
    if (err.message.includes('ENOTFOUND')) {
      console.log('🔍 DNS Error - Server might be offline or address is wrong');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.log('🔍 Connection Refused - Server is likely offline');
    } else if (err.message.includes('Invalid username')) {
      console.log('🔍 Username Error - Try a different username');
    } else if (err.message.includes('Failed to verify username')) {
      console.log('🔍 Auth Error - Make sure offline mode is correct');
    }
  });

  bot.on('end', (reason) => {
    clearTimeout(connectionTimeout);
    console.log('🔌 Disconnected. Reason:', reason || 'Unknown');
    
    // تأخير أطول إذا كان هناك أخطاء متكررة
    const delay = connectionAttempts > 5 ? 30000 : 5000;
    console.log(`⏳ Reconnecting in ${delay/1000} seconds...`);
    
    setTimeout(createBot, delay);
  });

  // إضافة مستمعات إضافية للتشخيص
  bot.on('login', () => {
    console.log('🔐 Login successful');
  });

  bot.on('health', () => {
    console.log(`❤️ Health: ${bot.health}, Food: ${bot.food}`);
  });

  bot.on('kicked', (reason) => {
    console.log('👢 Kicked from server:', reason);
    lastError = `Kicked: ${reason}`;
  });
}

function startAntiAFK() {
  console.log('🤖 Anti-AFK started');
  
  setInterval(() => {
    if (bot && bot.entity) {
      try {
        // حركات متنوعة لتجنب AFK
        const actions = [
          () => {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 100);
          },
          () => {
            bot.look(bot.entity.yaw + 0.1, bot.entity.pitch, true);
          },
          () => {
            const messages = ['Still here!', 'Bot active', 'Online 24/7'];
            if (Math.random() < 0.1) { // 10% احتمال إرسال رسالة
              bot.chat(messages[Math.floor(Math.random() * messages.length)]);
            }
          }
        ];
        
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        randomAction();
        
      } catch (err) {
        console.log('❌ Anti-AFK error:', err.message);
      }
    }
  }, 30000); // كل 30 ثانية
}

// بدء البوت
createBot();
console.log('🚀 Bot system started!');

// Self-ping لإبقاء الخدمة حية
if (process.env.RENDER) {
  const url = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  setInterval(() => {
    fetch(url)
      .then(() => console.log('Self-ping successful'))
      .catch(() => console.log('Self-ping failed'));
  }, 4 * 60 * 1000); // كل 4 دقائق
}

// إضافة معالج للإغلاق النظيف
process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  if (bot) {
    bot.end();
  }
  process.exit(0);
});
