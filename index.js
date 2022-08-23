const { Client, GatewayIntentBits } = require("discord.js"),
  bot = new Client({ intents: [GatewayIntentBits.Guilds] });
const fs = require("fs");
(function requireAll(dir) {
  fs.readdir(dir, (_, files) => {
    for (const file of files) {
      const filePath = `${dir}/${file}`;
      fs.lstat(filePath, (_, stats) => {
        if (stats.isDirectory()) {
          requireAll(filePath);
        } else if (filePath.endsWith(".js")) {
          console.log(filePath, require(filePath));
        }
      });
    }
  });
})(`${__dirname}/foo`);
require("./dis-uniter")(bot);
bot.login();
