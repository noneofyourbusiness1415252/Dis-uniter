const { createServer } = require("http"),
  { get } = require("https"),
  { execSync } = require("child_process"),
  { env } = process,
  { loadavg } = require("os"),
  { appendFileSync, readFileSync, writeFileSync } = require("fs");
module.exports = (/**@type{Client}*/ bot) => {
  async function fetchData() {
    const { application, user } = bot;
    await user.fetch();
    await application
      .fetch()
      .then(({ owner }) => (owner.owner?.user ?? owner).fetch());
    application.HTMLDescription = application.description
      .replace(/(?<!\*|\\)\*(.*)(?<!\*)\*/g, "<i>$1</i>")
      .replace(/(?<!\\)\*\*(.*)\*\*/g, "<b>$1</b>")
      .replace(/(?<!\\)_(.*)_/g, "<u>$1</u>")
      .replace(/(?<!\\)~~(.*)~~/g, "<strike>$1</strike>")
      .replace(/(?<!``|\\)(?!``)`(.*)`/g, "<tt>$1</tt>")
      .replace(/(?<!\\)```(.*)```/gs, "<tt>$1</tt>");
  }
  function handleRateLimit({
    timeToReset = 1e5,
    timeout = timeToReset,
    global,
  }) {
    if (timeout > 1e4 && !global) {
      bot.emit("warn", "Rate limit: restarting");
      get(
        `https://cd594a2f-0e9f-48f1-b3eb-e7f6e8665adf.id.repl.co/${env.REPL_ID}`,
        () => process.kill(1)
      );
    }
  }
  get(`https://discord.com/api/v10/gateway`, ({ statusCode }) => {
    if (statusCode == 429) handleRateLimit({});
  });
  bot.on("warn", (msg) =>
    appendFileSync("log", `⚠ ${Date.now()}: ${msg.replace(/\n/g, "⚠\n")}\n`)
  );
  bot.on("error", (err) =>
    appendFileSync(
      "log",
      `⚠ ${Date.now()}: ${err.message.replace(/\n/g, "⚠\n")}\n`
    )
  );
  bot.on("debug", (msg) => appendFileSync("log", `${Date.now()}: ${msg}\n`));
  if (bot.readyAt)
    process.emitWarning("Oops. You put this after `client.login()`");
  bot.rest.on?.("rateLimited", handleRateLimit) ??
    bot.on("rateLimit", handleRateLimit);
  bot.once("ready", async () => {
    await fetchData();
    const { application, user, presence } = bot;
    createServer((req, res) => {
      owner = application.owner.owner?.user ?? application.owner;
      res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(
        req.url == "/err"
          ? `${readFileSync("log")}`
              .split("\n")
              .filter((line) => line[0] == "⚠")
              .join("\n")
          : req.url == "/dbg"
          ? `${readFileSync("log")}`
          : `<!DOCTYPE html><meta charset=utf-8><meta name=viewport content='width=device-width'><meta name=description content='${
              application.description
            }'><meta name=author content='${owner}'><meta name=twitter:image content=${user.avatarURL()}><title>${
              user.tag
            }</title><link rel=icon href=${user.displayAvatarURL()}><script src=https://cdn.jsdelivr.net/gh/adamvleggett/drawdown/drawdown.min.js></script><script>var d;onload=()=>{document.getElementById('r').textContent=new Date(${
              bot.readyTimestamp
            }).toLocaleString();setInterval(()=>{let u=BigInt(Math.floor((Date.now()-${
              bot.readyTimestamp
            })/1000));document.getElementById('u').innerText=\`\${u>86400n?\`\${u/86400n}d\`:''}\${u>3600n?\`\${u/3600n%60n}h\`:''}\${u>60n?\`\${u/60n%24n}m\`:''}\${\`\${u%60n}\`}s\`}, 1000);setInterval(()=>{let x=new XMLHttpRequest();x.open("GET",document.getElementById('s').innerText[0]=='S'?'err':'dbg');x.onload=r=>{document.getElementById('l').innerText=r.srcElement.responseText.replace(/\w*([0-9]+): /g,(_, d)=>\`$\{new Date(d/1).toLocaleString()\}: \`)};x.send()},1e4)}</script><style>*:not(tt){background-color:#FDF6E3;color:#657B83;font-family:sans-serif;text-align:center;margin:auto}@media(prefers-color-scheme:dark){*:not(tt){background-color:#002B36;color:#839496}}img{height:1em}td{border:1px}</style><html lang=en><h1>${
              user.tag
            }<img src='${bot.user.avatarURL()}'alt></h1><p>${
              application.HTMLDescription
            }<table><tr><td>Guilds<td>${bot.guilds.cache.size}<tr><td>Ping<td>${
              bot.ws.ping
            }ms<tr><td>Up since<td id=r><tr><td>Uptime<td id=u><tr><td>Status<td>${
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
            }>${owner.tag}<img src=${
              owner.banner
            } alt></table><button type=button id=s onclick="document.getElementById('s').innerText=\`\${document.getElementById('s').innerText[0]=='S'?'Hide':'Show'} debug\`">Show debug</button><p><tt id=l>`
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
    process.stdin.on("data", fetchData);
  });
};
if (__dirname == process.cwd()) {
  const bot = new (require("discord.js").Client)({ intents: 0 });
  module.exports(bot);
  bot.login();
}
