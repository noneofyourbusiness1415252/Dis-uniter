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
    await bot.application.fetch();
    await bot.user.fetch();
    const { application, user } = bot;
    await application
      .fetch()
      .then(({ owner }) => (owner.owner?.user ?? owner).fetch());
    application.HTMLDescription = application.description
      .replace(/&/g, "&amp")
      .replace(/</g, "&lt")
      .replace(/>/g, "&gt")
      .replace(
        /(?<!\\)(`(?:``|))(.+?)\1/gs,
        (_, _delim, code) =>
          `<pre>${code.replace(/[*_\\]|~~|\|\|/g, "\\$&")}\</pre>`
      )
      .replace(/&lt(.+:\/\/[^\w]*)&gt/g, "<a href='$1'>$1</a>")
      .replace(/(?<!\\)\*\*(.+?)(?<!\\)\*\*/g, "<b>$1</b>")
      .replace(/(?<!\\)([*^])(.+?)(?<!\\)\1/g, "<i>$2</i>")
      .replace(/(?<!\\)__(.+?)(?<!\\)__/g, "<u>$1</u>")
      .replace(/(?<!\\)~~(.+?)(?<!\\)~~/g, "<strike>$1</strike>")
      .replace(/(?<!\\)\|\|(.+?)(?<!\\)\|\|/g, "<details>$1</details>")
      .replace(/^&gt&gt&gt (.+)/ms, "<blockquote><p>$1</blockquote>")
      .replace(/^&lt (.+?)/gm, "<blockquote><p>$1</blockquote>")
      .replace(/\\/g, "");
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
    appendFileSync(
      "log",
      `⚠ ${Date.now()}: ${msg.replace(
        /\n/g,
        `⚠
`
      )}
`
    );
    clearOld();
  });
  bot.on("error", ({ message }) => {
    appendFileSync(
      "log",
      `⚠ ${Date.now()}: ${message.replace(
        /\n/g,
        `⚠
`
      )}
`
    );
    clearOld();
  });
  bot.on("debug", (msg) => {
    appendFileSync(
      "log",
      `${Date.now()}: ${msg}
`
    );
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
        {
          err: `${`${readFileSync("/proc/meminfo")}`.match(
            /(?<=le:.*)\d+/
          )}kB${`${readFileSync("log")}`
            .match(/^⚠ .*/m)?.join(`
`) ?? ""}`,
          dbg: `${`${readFileSync("/proc/meminfo")}`.match(
            /(?<=le:.*)\d+/
          )}kB${readFileSync("log")}`,
          "": `<!DOCTYPE html><meta charset=utf-8><meta name=viewport content='width=device-width'><meta name=description content='${
            application.description
          }'><meta name=author content='${owner}'><meta name=twitter:image content=${user.avatarURL(
            { extension: "png" }
          )}><title>${
            user.tag
          }</title><link rel=icon href=${user.displayAvatarURL({
            extension: "png",
          })}><style>blockquote>*{border-right:4px solid #FDF6E3;border-left:4px solid #EEE8D5;display:inline;padding:4px 4px;border-radius:1px;border-color:}*:not(pre){background-color:#FDF6E3;color:#657B83;font-family:sans-serif;text-align:center;margin:0 auto}@media(prefers-color-scheme:dark){*:not(pre){background-color:#002B36;color:#839496}blockquote>*{border-color:#073642}}img{height:1em}td{border:1px}pre{display:inline}p{white-space:pre-wrap}body{display:flex;flex-flow:row wrap;width:100vw}#o,#v{overflow:auto}#o{min-width:min-content;flex:1}#v{height:100vh}button{display:inline-block}a{color:#268BD2}</style><html lang=en><div id=o><h1>${
            user.tag
          }<img src='${bot.user.avatarURL({
            extension: "png",
          })}'alt></h1><p id=d><table><tr><th>Guilds<td>${
            bot.guilds.cache.size
          }<tr><th>Ping<td>${
            bot.ws.ping
          }ms<tr><th>Up since<td id=r><tr><th>Uptime<td id=u><tr><th>Status<td>${
            presence.status
          }<tr><th>Activity<td>${presence.activities.join(
            ", "
          )}<tr><th>Tags<td>${application.tags.join(
            ", "
          )}<tr><th>Owner<td><img src=${owner.displayAvatarURL({
            extension: "png",
          })} alt><a href=https://discord.com/users/${owner.id}>${
            owner.tag
          }<img src=${
            owner.banner
          } alt><tr><th>RAM available<td>${`${readFileSync(
            "/proc/meminfo"
          )}`.match(/(?<=le:.*)\d+/)}kB</table>${
            application.install
          }<p></div><div id=v><button type=button id=s onclick="document.getElementById('s').innerText=\`\${document.getElementById('s').innerText[0]=='S'?'Hide':'Show'} debug\`">Show debug</button><p><pre id=l></div><script>try{let n,t;function l(){let x=new XMLHttpRequest();x.open("GET",document.getElementById('s').innerText[0]=='S'?'err':'dbg');x.onload=r=>{document.getElementById('l').innerText=r.srcElement.responseText.replace(/.+?B/, r=>{document.querySelector("tr:last-of-type td").innerText=r;return""}).replace(/([0-9]+): /g,(_, d)=>\`$\{new Date(d/1).toLocaleString()\}: \`)};x.send()};document.onvisibilitychange=()=>{if(document.visibilityState=="hidden")clearInterval(n);else n=setInterval(l,5e3)};document.getElementById('r').textContent=new Date(${
            bot.readyTimestamp
          }).toLocaleString();setInterval(()=>{let u=BigInt(Math.floor((Date.now()-${
            bot.readyTimestamp
          })/1000));document.getElementById('u').innerText=\`\${u>86400n?\`\${u/86400n}d\`:''}\${u>3600n?\`\${u/3600n%60n}h\`:''}\${u>60n?\`\${u/60n%24n}m\`:''}\${\`\${u%60n}\`}s\`}, 1000);n=setInterval(l,5e3);let d=document.getElementById('d'),f=new Intl.RelativeTimeFormat();d.innerHTML=\`${application.HTMLDescription.replace(
            /`/g,
            "\\`"
          )}\`.replace(/&ltt:(\\d+):R&gt/g,(_,t)=>{const r=t-Date.now(),a=Math.abs(r);return \`<abbr title="\${new Date(t/1).toLocaleString(0,{timeStyle:"short",dateStyle:"full"})}">\${a>31536e6?f.format(r/31536e6,"year"):a>7884e6?f.format(r/7884e6,"quarter"):a>2628e6?f.format(r/2628e6,"month"):a>6048e5?f.format(r/6048e5,"week"):a>864e5?f.format(r/864e5,"day"):a>36e5?f.format(r/36e5,"hour"):a>6e4?f.format(r/6e4,"minute"):f.format(r/1e3,"second")}</abbr>\`}).replace(/&ltt:(\\d+)(:[tdf])?&gt/gi,(_,t,m)=>{const d=Date.prototype.toLocaleString.bind(new Date(t/1),0);m=m?.[1];return \`<abbr title="\${d({timeStyle:"short",dateStyle:"full"})}">\${d({timeStyle:{t:"short",T:"long"}[m],dateStyle:{d:"short",D:"long"}[m]})}</abbr>\`})}catch(err){open(\`data:text/plain,\${err}\`,"_blank")}</script>`,
        }[req.url.slice(1)]
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
