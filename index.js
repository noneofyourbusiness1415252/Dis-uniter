const { Client, GatewayIntentBits } = require("discord.js"),
  bot = new Client({ intents: [GatewayIntentBits.Guilds] });
const fs = require("fs");
require("./dis-uniter")(bot);
bot.login();
