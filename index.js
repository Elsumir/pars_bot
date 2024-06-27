const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const fs = require('fs');
let rawdata = fs.readFileSync('my.json');
let parseddata = JSON.parse(rawdata);

app.get('/', (req, res) => {
  res.send('Bot is alive');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const url =
  'https://ad.betcity.ru/d/on_air/bets?rev=8&add=dep_event&ver=364&csn=ooca9s';

const botToken = process.env.BOT;
const chatId = process.env.CHAT;

const messageForBot = async (messageText) => {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: messageText,
    }),
  });

  console.log('Есть событие!');
};

const searchEvent = async () => {
  const data = await fetch(url).then((res) => res.json());
  const championship = Object.values(data.reply.sports[3].chmps);
  const seachPercent = 14.9;

  championship.forEach(async (game) => {
    const { name_ch, id_ch: id } = game;
    const { stat_link, main, name_ht, name_at } = Object.values(game.evts)[0];
    const linkStat = `https://betcity.ru/ru/mstat/${stat_link}`;
    const TotalData = await fetch(linkStat).then((res) => res.text());
    const regex = /Тотал (\d+.\d+)/;
    const match = regex.exec(TotalData);
    const noDubl = parseddata.filter((e) => e.id === id).length;
    const urlEvent = `https://betcity.ru/ru/live/basketball/${id}/${id_ev}`;

    if (match && main && main[72] && !noDubl) {
      const total = +parseFloat(match[1]);
      const totalLive = Object.values(main[72]?.data)[0].blocks.T1m.Tot;
      const absoluteDifference = Math.abs(total - totalLive);
      const baseNumber = Math.max(total, totalLive);
      const percentDif = ((absoluteDifference / baseNumber) * 100).toFixed(2);
      const bet = totalLive < total ? `ТБ ${totalLive}` : `ТМ ${totalLive}`;
      const message = `${name_ch}/nTotal ${total}/nK1: ${name_ht}/nK2: ${name_at}/nРазница в ${percentDif}%/nСтавка ${bet}/n${urlEvent}`;

      if (percentDif > seachPercent) {
        messageForBot(message);
        await parseddata.push({
          id,
        });
        let data = JSON.stringify(parseddata);
        fs.writeFileSync('my.json', data);
      }
    }
  });
};
// res();
setInterval(searchEvent, 20000);

if (parseddata.length > 100) {
  const newArr = parseddata.pop();
  const data = JSON.stringify(newArr);
  fs.writeFileSync('my.json', data);
}

const bot = new TelegramBot(botToken, { polling: true });

bot.on('message', (msg) => {
  bot.sendMessage(chatId, 'Работаю!');
});

module.exports = app;



