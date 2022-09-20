const { createServer } = require("http"),
  { get } = require("https"),
  { execSync } = require("child_process"),
  { env } = process,
  { loadavg } = require("os"),
  { appendFileSync } = require("fs");
function handleRateLimit({ timeToReset, timeout, global }) {
  if ((timeToReset ?? timeout) > 10000 && !global) {
    process.emitWarning("Rate limit: restarting");
    get(
      `https://cd594a2f-0e9f-48f1-b3eb-e7f6e8665adf.id.repl.co/${env.REPL_ID}`,
      () => process.kill(1)
    );
  }
}
const log = (msg) => appendFileSync("log", `${Date.now()}: ${msg}\n`);
module.exports = (/**@type{Client}*/ bot) => {
  bot.on("warn", log);
  bot.on("error", log);
  if (bot.readyAt)
    process.emitWarning("Oops. You put this after `client.login()`");
  bot.rest.on?.("rateLimited", handleRateLimit) ??
    bot.on("rateLimit", handleRateLimit);
  bot.once("ready", async () => {
    await bot.application.fetch();
    await bot.user.fetch(false);
    const { application, user, presence } = bot;
    let owner = application.owner.owner?.user ?? application.owner;
    await owner.fetch(false);
    createServer((_, res) => {
      const description = application.description.replace(/"/g, "\\");
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
        }</title><link rel=icon href=${user.displayAvatarURL()}><script src=https://cdn.jsdelivr.net/gh/adamvleggett/drawdown/drawdown.min.js></script><script>onload=()=>{document.getElementById('s').textContent=new Date(${
          bot.readyTimestamp
        }).toLocaleString();setInterval(()=>{let u=BigInt(Math.floor((Date.now()-${
          bot.readyTimestamp
        })/1000));document.getElementById('u').innerText=\`\${u>86400n?\`\${u/86400n}d\`:''}\${u>3600n?\`\${u/3600n%60n}h\`:''}\${u>60n?\`\${u/60n%24n}m\`:''}\${\`\${u%60n}\`}s\`}, 1000);document.getElementById('d').innerHTML=markdown("${description}")}</script><style>*{background-color:#FDF6E3;color:#657B83;font-family:sans-serif;text-align:center;margin:auto}@media(prefers-color-scheme:dark){*{background-color:#002B36;color:#839496}}img{height:1em}td{border:1px}</style><html lang=en><h1>${
          user.tag
        }<img src='${bot.user.avatarURL()}'alt></h1><p id=d><table><tr><td>Guilds<td>${
          bot.guilds.cache.size
        }<tr><td>Ping<td>${
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
          .reduce((a, b) => a + b)}B<tr><td>CPU load<td>${
          loadavg()[0]
        }<tr><td>Owner<td><img src=${owner.displayAvatarURL()} alt><a href=https://discord.com/users/${
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
        .then(({ owner }) => (owner.owner?.user ?? owner).fetch());
    });
  });
};
if (__dirname == process.cwd()) {
  const bot = new (require("discord.js").Client)({ intents: 0 });
  module.exports(bot);
  bot.login();
}
