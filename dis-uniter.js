const { createServer, get } = require("http"),
  { execSync } = require("child_process");
module.exports = (bot) => {
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
  bot.on("ready", async () => {
    bot.application.fetch();
    bot.user.fetch();
    createServer(async (_, res) => {
      const u = BigInt(Math.floor((Date.now() - bot.readyAt) / 1000)),
        owner = bot.application.owner?.owner?.user || bot.application.owner;
      owner?.fetch();
      res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(
        `<!DOCTYPE html><meta charset=utf-8><meta name=viewport content='width=device-width'><meta name=description content='${
          bot.application.description
        }'><meta name=author content='${owner}'><meta name=twitter:image content=${bot.user.avatarURL()}><title>${
          bot.user.tag
        }</title><link rel='shortcut icon' href='${bot.user.avatarURL()}''><script>onload=()=>{document.getElementById('s').textContent=new Date(${
          bot.readyTimestamp
        }).toLocaleString();setInterval(()=>{location.reload()},5e3)}</script><style>*{background-color:#FDF6E3;color:#657B83;font-family:sans-serif;text-align:center;margin:auto}@media(prefers-color-scheme:dark){*{background-color:#002B36;color:#839496}}img{height:1em}td{border:1px}</style><html lang=en><html lang=en><h1>${
          bot.user.tag
        }<img src='${bot.user.avatarURL()}'alt></h1><p>${
          bot.application.description
        }</p><table><tr><td>Channels<td>${
          bot.channels.cache.size
        }<tr><td>Guilds<td>${bot.guilds.cache.size}<tr><td>Ping<td>${
          bot.ws.ping
        }ms<tr><td>Up since<td id=s><tr><td>Uptime<td>${
          u > 86400n ? `${u / 86400n}d` : ""
        }${u > 3600n ? `${(u / 3600n) % 60n}h` : ""}${
          u > 60n ? `${(u / 60n) % 24n}m` : ""
        }${`${u % 60n}`}s<tr><td>Status<td>${
          bot.presence.status
        }<tr><td>Activity<td>${bot.presence.activities.join(
          ", "
        )}<tr><td>Tags<td>${bot.application.tags.join(
          ", "
        )}<tr><td>RAM<td>${`${execSync("ps hx -o rss")}`
          .split("\n")
          .map(Number)
          .reduce(
            (a, b) => a + b
          )}B<tr><td>Owner<td><img src=${owner?.displayAvatarURL()} alt><a href=https://discord.com/users/${
          owner?.id
        }>${owner?.tag}<img src=${owner?.banner} alt>`
      );
    }).listen(80, "", () =>
      console.log(`${bot.user.tag} is alive! Starting web server`)
    );
    get(
      `http://up.repl.link/add?repl=${process.env.REPL_SLUG}&author=${process.env.REPL_OWNER}`
    );
  });
};
