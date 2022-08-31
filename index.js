const { createServer, get } = require("http"),
  { execSync } = require("child_process"),
  { env } = process, { loadavg } = require("os");
module.exports = (/**@type{Client}*/ bot) => {
  bot.rest.on?.("rateLimited", ({ timeToReset, global }) => {
    if (timeToReset > 10000 && !global) {
      console.error("Rate limit: restarting");
      process.kill(1);
    }
  }) ??
    bot.on("rateLimit", ({ timeout, global }) => {
      if (timeout > 10000 && !global) {
        console.error("Rate limit: restarting");
        process.kill(1);
      }
    });
  bot.once("ready", async () => {
    await bot.application.fetch();
    await bot.user.fetch(false);
    const { application, user, presence } = bot;
    /**@type{User}*/ let owner =
      application.owner.owner?.user ?? application.owner;
    await owner.fetch(false);
    createServer((_, res) => {
      owner = application.owner.owner?.user ?? application.owner;
      res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(
        `<!DOCTYPE html><meta charset=utf-8><meta name=viewport content='width=device-width'><meta name=description content='${
          application.description
        }'><meta name=author content='${owner}'><meta name=twitter:image content=${user.avatarURL()}><title>${
          user.tag
        }</title><link rel='shortcut icon' href='${user.displayAvatarURL()}''><script>onload=()=>{document.getElementById('s').textContent=new Date(${
          bot.readyTimestamp
        }).toLocaleString();setInterval(()=>{let u=BigInt(Math.floor((Date.now()-${
          bot.readyTimestamp
        })/1000));document.getElementById('u').innerText=\`\${u>86400n?\`\${u/86400n}d\`:''}\${u>3600n?\`\${u/3600n%60n}h\`:''}\${u>60n?\`\${u/60n%24n}m\`:''}\${\`\${u%60n}\`}s\`}, 1000)}</script><style>*{background-color:#FDF6E3;color:#657B83;font-family:sans-serif;text-align:center;margin:auto}@media(prefers-color-scheme:dark){*{background-color:#002B36;color:#839496}}img{height:1em}td{border:1px}</style><html lang=en><h1>${
          user.tag
        }<img src='${bot.user.avatarURL()}'alt></h1><p>${
          application.description
        }</p><table><tr><td>Channels<td>${
          bot.channels.cache.size
        }<tr><td>Guilds<td>${bot.guilds.cache.size}<tr><td>Ping<td>${
          bot.ws.ping
        }ms<tr><td>Up since<td id=s><tr><td>Uptime<td id=u><tr><td>Status<td>${
          presence.status
        }<tr><td>Activity<td>${presence.activities.join(
          ", "
        )}<tr><td>Tags<td>${application.tags.join(
          ", "
        )}<tr><td>RAM<td>${`${execSync("ps hx -o rss")}`
          .split("\n")
          .map(Number)
          .reduce(
            (a, b) => a + b
          )}B<tr><td>CPU load<td>${loadavg()[0]}<tr><td>Owner<td><img src=${owner.displayAvatarURL()} alt><a href=https://discord.com/users/${
          owner.id
        }>${owner.tag}<img src=${owner.banner} alt>`
      );
    }).listen(80, "", () =>
      console.log(
        `${user.tag} is alive! Hit enter at any time to update user and application info to show on the website`
      )
    );
    get(
      `https://ced0775a-02a8-41d5-a6cf-14815ad4a73e.id.repl.co
/add?repl=${env.REPL_SLUG}&author=${env.REPL_OWNER}`
    );
    process.stdin.on("data", () => {
      bot.user.fetch();
      bot.application
        .fetch()
        .then(({ owner }) =>
          /**@type{User}*/ (owner.owner?.user ?? owner).fetch()
        );
    });
  });
};
if (__dirname == process.cwd()) {
  const { Client, GatewayIntentBits, User } = require("discord.js"),
    bot = new Client({ intents: [GatewayIntentBits.Guilds] });
  module.exports(bot);
  bot.login();
}
