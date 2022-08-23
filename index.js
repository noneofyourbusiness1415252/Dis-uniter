const { Client, GatewayIntentBits } = require("discord.js"),
  bot = new Client({ intents: [GatewayIntentBits.Guilds] });
require("./dis-uniter")(bot);
bot.login();
