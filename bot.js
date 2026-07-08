require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "-1003924350648";
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let running = false;
let timer = null;
let userLastUsed = {};
let messageCount = 0;

// ✅ Pehle Wala Generate Random User ID
function generateRandomUserId() {
  const now = Date.now();

  let repeatUsers = Object.keys(userLastUsed).filter(uid => {
    let diff = (now - userLastUsed[uid]) / 1000;
    return diff >= 300 && diff <= 600;
  });

  if (repeatUsers.length && Math.random() <= 0.4) {
    let uid = repeatUsers[Math.floor(Math.random() * repeatUsers.length)];
    userLastUsed[uid] = now;
    return uid;
  }

  while (true) {
    let uid = `${Math.floor(Math.random() * 4000 + 6000)}****${Math.floor(Math.random() * 9000 + 1000)}`;
    if (!userLastUsed[uid]) {
      userLastUsed[uid] = now;
      return uid;
    }
  }
}

// ✅ Indian Time Formatter (DD/MM/YYYY, HH:MM:SS AM/PM)
function getIndianTime() {
  const now = new Date();
  
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  
  return `${day}/${month}/${year}, ${formattedHours}:${minutes}:${seconds} ${ampm}`;
}

// ✅ Build Message - Bilkul Pehle Jaisa
function buildMessage(userId, amount, runTime, trackTime) {
  return (
`Test Conversation Count 💝

🎁 Offer Name - Test

User Id : ${userId}
User Amount : ₹${amount}
🥳 User Payment : Success

Run Time - ${runTime}
Track Time - ${trackTime}

Powered By - CashFlix`
  );
}

// Send Message Function
async function sendMessageToChannel(userId, amount, runTime, trackTime) {
  try {
    await bot.sendMessage(
      CHANNEL_ID,
      buildMessage(userId, amount, runTime, trackTime)
    );
    messageCount++;
    console.log(`✅ ₹${amount} message sent for ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

// 🔥 Second Message - Random 1-2 Minute
async function sendSecondMessage(userId, runTime) {
  const randomDelay = Math.floor(Math.random() * 60000) + 60000;
  
  console.log(`⏳ Second message for ${userId} will send in ${Math.round(randomDelay/1000)} seconds`);

  setTimeout(async () => {
    if (!running) return;
    
    try {
      const trackTime = getIndianTime();
      await bot.sendMessage(
        CHANNEL_ID,
        buildMessage(userId, "5", runTime, trackTime)
      );
      messageCount++;
      console.log(`✅ ₹5 message sent for ${userId}`);
    } catch (error) {
      console.error(`❌ Second message error:`, error.message);
    }
  }, randomDelay);
}

// 🔥 MAIN FUNCTION
async function startConversation() {
  console.log("🚀 Started - 3 messages per minute (₹0.1) + Random second messages (₹5)");

  timer = setInterval(async () => {
    if (!running) {
      clearInterval(timer);
      timer = null;
      return;
    }

    console.log(`⏰ Running at ${getIndianTime()}`);

    // ===== 3 Messages with ₹0.1 =====
    for (let i = 0; i < 3; i++) {
      try {
        let userId = generateRandomUserId();
        let runTime = getIndianTime();
        let trackTime = getIndianTime();

        await sendMessageToChannel(userId, "0.1", runTime, trackTime);
        sendSecondMessage(userId, runTime);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error("❌ Error:", error.message);
      }
    }

    console.log(`✅ 3 messages (₹0.1) sent`);

  }, 60000);
}

// ===== TELEGRAM COMMANDS =====

bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (running) {
    return bot.sendMessage(chatId, "⚠️ Already running!");
  }

  try {
    const botInfo = await bot.getMe();
    await bot.getChatMember(CHANNEL_ID, botInfo.id);
  } catch (error) {
    return bot.sendMessage(chatId, "❌ Bot is not admin in channel!");
  }

  running = true;
  messageCount = 0;
  startConversation();
  bot.sendMessage(chatId, "✅ Started! 3x ₹0.1 + Random ₹5 (1-2 min)");
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  
  running = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  
  bot.sendMessage(chatId, `🛑 Stopped. Total: ${messageCount}`);
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
📊 Status:
Running: ${running ? "✅ Yes" : "❌ No"}
Total Messages: ${messageCount}
Users: ${Object.keys(userLastUsed).length}
Time: ${getIndianTime()}
  `);
});

// ===== PORT KE LIYE (Render Ke Liye) =====
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('🤖 Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

console.log("🤖 Bot Started...");
console.log(`📢 Channel: ${CHANNEL_ID}`);
console.log(`🕐 Indian Time: ${getIndianTime()}`);
