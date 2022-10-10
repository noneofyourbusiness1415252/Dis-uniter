const { createServer } = require("http"),
  { get } = require("https"),
  { execSync } = require("child_process"),
  { env } = process,
  { loadavg } = require("os"),
  { appendFileSync, readFileSync, writeFileSync } = require("fs");

function clearOld() {
  const dayAgo = Date.now() - 864e5;
  writeFileSync(
    "log",
    `${readFileSync("log")}`
      .split(/(?=^(⚠ |)\d+: )/gm)
      .filter((log) => log.match(/\d+/)?.[0] > dayAgo)
      .join("")
  );
}
module.exports = (/**@type{Client}*/ bot) => {
  async function fetchData() {
    const { application, user } = bot;
    await user.fetch();
    await application
      .fetch()
      .then(({ owner }) => (owner.owner?.user ?? owner).fetch());
    application.HTMLDescription = application.description
      .replace(/(?<!\*|\\)\*([^\*]+)(?<!\*)\*/g, "<i>$1</i>")
      .replace(/(?<!\\)\*\*([^\*]+)\*\*/g, "<b>$1</b>")
      .replace(/(?<!\\)_([^\_]+)_/g, "<u>$1</u>")
      .replace(/(?<!\\)~~([^\~]+)~~/g, "<strike>$1</strike>")
      .replace(/(?<!\\)\|\|([^\\|]+)\|\|/g, "<details>$1</details>")
      .replace(/(?<!\\)`(``|)([^\`]+)`(``|)/gs, "<tt>$2</tt>");
    const { installParams, customInstallURL } = application;
    application.install = customInstallURL
      ? `<a href=${customInstallURL}>Install</a>`
      : installParams
      ? `<a href=https://discord.com/api/oauth2/authorize?client_id=${
          application.id
        }&scope=${installParams.scopes.join("+")}&permissions=${
          installParams.permissions.bitfield
        }>Install</a>`
      : "";
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
  bot.on("warn", (msg) => {
    appendFileSync("log", `⚠ ${Date.now()}: ${msg.replace(/\n/g, "⚠\n")}\n`);
    clearOld();
  });
  bot.on("error", ({ message }) => {
    appendFileSync(
      "log",
      `⚠ ${Date.now()}: ${message.replace(/\n/g, "⚠\n")}\n`
    );
    clearOld();
  });
  bot.on("debug", (msg) => {
    appendFileSync("log", `${Date.now()}: ${msg}\n`);
    clearOld();
  });
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
          ? `${`${readFileSync("log")}`
              .split("\n")
              .filter((line) => line[0] == "⚠")
              .join("\n")}`
          : req.url == "/dbg"
          ? `Available RAM: ${`${readFileSync("/proc/meminfo")}`.match(
              /(?<=le:.*)\d+/
            )}\n${readFileSync("log")}B`
          : `<!DOCTYPE html><meta charset=utf-8><meta name=viewport content='width=device-width'><meta name=description content='${
              application.description
            }'><meta name=author content='${owner}'><meta name=twitter:image content=${user.avatarURL()}><title>${
              user.tag
            }</title><link rel=icon href=${user.displayAvatarURL()}><script>let n,t;function l(){let x=new XMLHttpRequest();x.open("GET",document.getElementById('s').innerText[0]=='S'?'err':'dbg');x.onload=r=>{document.getElementById('l').innerText=r.srcElement.responseText.replace(/\w*([0-9]+): /g,(_, d)=>\`$\{new Date(d/1).toLocaleString()\}: \`)};x.send()};document.onvisibilitychange=()=>{if(document.visibilityState=="hidden")clearInterval(n);else n=setInterval(l,1e4)};onload=()=>{document.getElementById('r').textContent=new Date(${
              bot.readyTimestamp
            }).toLocaleString();setInterval(()=>{let u=BigInt(Math.floor((Date.now()-${
              bot.readyTimestamp
            })/1000));document.getElementById('u').innerText=\`\${u>86400n?\`\${u/86400n}d\`:''}\${u>3600n?\`\${u/3600n%60n}h\`:''}\${u>60n?\`\${u/60n%24n}m\`:''}\${\`\${u%60n}\`}s\`}, 1000);n=setInterval(l,5e3);let d=document.getElementById('d'),f=new Intl.RelativeTimeFormat();d.innerHTML=\`${application.HTMLDescription.replace(
              /`/g,
              "\\`"
            )}\`.replace(/<t:(\\d+):R>/g,(_,t)=>{const r=t-Date.now(),a=Math.abs(r);return \`<abbr title="\${new Date(t/1).toLocaleString()}">\${a>31536e6?f.format(r/31536e6,"year"):a>7884e6?f.format(r/7884e6,"quarter"):a>2628e6?f.format(r/2628e6,"month"):a>6048e5?f.format(r/6048e5,"week"):a>864e5?f.format(r/864e5,"day"):a>36e5?f.format(r/36e5,"hour"):a>6e4?f.format(r/6e4,"minute"):f.format(r/1e3,"second")}</abbr>\`}).replace(/<t:(\\d+)(:[tdf])?>/gi,(_,t,m)=>{const d=new Date(t/1);m=m?.[1];return \`<abbr title="\${d.toLocaleString()}">\${m=="t"?d.toLocaleTimeString({timeStyle:"short"}):m=="T"?d.toLocaleTimeString():m=="d"?d.toLocaleDateString({dateStyle:"short"}):m=="D"?d.toLocaleDateString():d.toLocaleString()}</abbr>\`})}</script><style>*:not(tt){background-color:#FDF6E3;color:#657B83;font-family:sans-serif;text-align:center;margin:auto}@media(prefers-color-scheme:dark){*:not(tt){background-color:#002B36;color:#839496}}img{height:1em}td{border:1px}</style><html lang=en><h1>${
              user.tag
            }<img src='${bot.user.avatarURL()}'alt></h1><p id=d><table><tr><td>Guilds<td>${
              bot.guilds.cache.size
            }<tr><td>Ping<td>${
              bot.ws.ping
            }ms<tr><td>Up since<td id=r><tr><td>Uptime<td id=u><tr><td>Status<td>${
              presence.status
            }<tr><td>Activity<td>${presence.activities.join(
              ", "
            )}<tr><td>Tags<td>${application.tags.join(
              ", "
            )}<tr><td>Owner<td><img src=${owner.displayAvatarURL()} alt><a href=https://discord.com/users/${
              owner.id
            }>${owner.tag}<img src=${owner.banner} alt></table>${
              application.install
            }<p><button type=button id=s onclick="document.getElementById('s').innerText=\`\${document.getElementById('s').innerText[0]=='S'?'Hide':'Show'} debug\`">Show debug</button><p><tt id=l>`
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
