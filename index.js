const { createServer } = require("http"),
  { appendFileSync, readFileSync, writeFileSync } = require("fs"),
  { version } = require("./package.json");
function clearOld() {
  const dayAgo = Date.now() - 864e5;
  writeFileSync(
    "log",
    `${readFileSync("log")}`
      .split(/(?=^⚠?\d+: )/gm)
      .filter((log) => log.match(/\d+/)?.[0] > dayAgo)
      .join("")
  );
}
function debug(msg) {
  appendFileSync(
    "log",
    `${Date.now()}: ${msg}
`
  );
  clearOld();
}
let HTMLDescription, install;
module.exports = (/**@type{Client}*/ bot) => {
  async function fetchData() {
    await bot.application.fetch();
    await bot.user.fetch();
    /**@type{{application:ClientApplication}}*/ const {
      application: { owner, installParams, customInstallURL, description, id },
    } = bot;
    (owner.owner?.user ?? owner).fetch();
    HTMLDescription = description
      .replace(/&/g, "&amp")
      .replace(/</g, "&lt")
      .replace(/>/g, "&gt")
      .replace(
        /(?<!\\)```(.+?)```/gs,
        (_, code) => `<pre>${code.replace(/[*_\\]|~~|\|\|/g, "\\$&")}</pre>`
      )
      .replace(
        /(?<!\\)`(.+?)`/g,
        (_, code) => `<code>${code.replace(/[*_\\]|~~|\|\|/g, "\\$&")}</code>`
      )
      .replace(/&lt(.+:\/\/[^\w]*)&gt/g, "<a href='$1'>$1</a>")
      .replace(/(?<!\\)\*\*(.+?)(?<!\\)\*\*/g, "<b>$1</b>")
      .replace(/(?<!\\)([*^])(.+?)(?<!\\)\1/g, "<i>$2</i>")
      .replace(/(?<!\\)__(.+?)(?<!\\)__/g, "<u>$1</u>")
      .replace(/(?<!\\)~~(.+?)(?<!\\)~~/g, "<strike>$1</strike>")
      .replace(/(?<!\\)\|\|(.+?)(?<!\\)\|\|/g, "<details>$1<summary></details>")
      .replace(/^&gt&gt&gt (.+)/ms, "<blockquote><p>$1</blockquote>")
      .replace(/^&gt (.+)/gm, "<blockquote><p>$1</blockquote>")
      .replace(/\\/g, "")
      .replace(/\n/g, "<br>");
    install = customInstallURL
      ? `<a href=${customInstallURL}>Install</a>`
      : installParams
      ? `<a href=//discord.com/api/oauth2/authorize?client_id=${id}&scope=${installParams.scopes.join(
          "+"
        )}&permissions=${installParams.permissions.bitfield}>Install</a>`
      : "";
  }
  bot.on("warn", (msg) => {
    appendFileSync(
      "log",
      `⚠${Date.now()}: ${msg}
`
    );
    clearOld();
  });
  bot.on("error", ({ message }) => {
    appendFileSync(
      "log",
      `⚠${Date.now()}: ${message}
`
    );
    clearOld();
  });
  bot.on("debug", debug);
  bot.on("interactionCreate", debug);
  bot.once("ready", async () => {
    await fetchData();
    const { application, user, presence } = bot;
    createServer(({ url, headers }, res) => {
      const locale = headers["accept-language"]?.match(/[^,]+/)?.[0],
        ramAvailable = () =>
          `${(+`${readFileSync("/proc/meminfo")}`.match(
            /(?<=le:.*)\d+/
          )).toLocaleString(locale)}`,
        localiseTime = (time) =>
          new Date(+time).toLocaleString(locale, {
            timeZone: path.slice(1),
          }),
        info = () =>
          `${ramAvailable()}
${bot.guilds.cache.size.toLocaleString(locale)}
${bot.ws.ping.toLocaleString(locale)}
${bot.readyTimestamp}
${presence.activities.join()}
`,
        path = url.slice(1),
        /**@type{User}*/ owner =
          application.owner.owner?.user ?? application.owner;
      res.writeHead(200, {
        "Content-Type": `text/html;charset=utf-8`,
        "Cache-Control": path ? "no-cache" : "max-age=180",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(
        path[0] == "e"
          ? `${info()}${`${readFileSync("log")}`.replace(
              /(?<=^|\n)\d+: .*?(?:\n⚠([0-9]+)|$)/gs,
              (_, time) => (time ? localiseTime(time) : "")
            )}`
          : path[0] == "d"
          ? `${info()}${`${readFileSync("log")}`.replace(
              /(?<=^⚠?)\d+/gm,
              localiseTime
            )}`
          : `<!DOCTYPE html><meta charset=utf-8><meta name=viewport content='width=device-width'><meta name=description content='${HTMLDescription}'><meta name=keywords content="${application.tags.join()}"><meta name=generator content="replit-dis-uniter ${version}"><meta name=author content='${owner}'><meta name=twitter:image content=${user.avatarURL(
              { extension: "png" }
            )}><title>${
              user.tag
            }</title><link rel=icon href=${user.displayAvatarURL({
              extension: "png",
            })}><style>*{text-align:center;margin:0 auto}blockquote>*{border-right:4px solid #007acc80;border-left:4px solid #007acc80;display:inline;padding:4px 4px;border-radius:1px}#s{font-size:.1em}body,table{background:#FDF6E3;color:#657B83;font-family:sans-serif}*button{background-color:#AC9D57}h1{color:#268BD2}@media(prefers-color-scheme:dark){body,table{background-color:#002B36;color:#839496}blockquote>*{border-color:#073642}button{background-color:#2AA19899}}img{height:1em}td{border:1px}p{white-space:pre-wrap}body{display:flex;flex-flow:row wrap;width:100vw}#o,#v{overflow:auto}#o{min-width:min-content;flex:1}#v{height:100vh}button{display:inline-block}a{color:#3794ff}.d,abbr{color:#cb4b16}.i{color:#D33682}code{color:#d7ba7d}i,b{color:#D33682}</style><html lang=en><div id=o><h1>${
              user.tag
            }<img src='${bot.user.avatarURL({
              extension: "png",
            })}'alt><span id=s>${
              { online: "🟢", offline: "⭕", idle: "⏰", dnd: "⛔" }[
                presence.status
              ]
            }</h1><p id=d><table><tr><th>Guilds<td class=i id=g>${bot.guilds.cache.size.toLocaleString(
              locale
            )}<tr><th title=latency>🏓<td><span class=i id=p>${bot.ws.ping.toLocaleString(
              locale
            )}</span>ms<tr><th>🎬<td class=d>${new Date(
              bot.readyTimestamp
            ).toLocaleString(locale, {
              timeZoneName: "short",
            })}<tr><th>⏱️<td class=d id=u>${new Date(
              Date.now() - bot.readyTimestamp
            ).toLocaleTimeString(locale, {
              hourCycle: "h23",
            })}<tr><th title=activity>🎮🏆👀👂<td id=a>${presence.activities.join()}<tr><th>🏷️<td>${application.tags.join()}<tr><th>👑<td><img src=${owner.displayAvatarURL(
              {
                extension: "png",
              }
            )} alt><a href=//discord.com/users/${owner.id}>${owner.tag}${
              owner.banner ? `<img src=${owner.bannerURL()} alt>` : ""
            }<tr><th title=RAM>🆓🔀🧠<td><span class=i id=r>${ramAvailable()}</span>kB</table>${install}<p></div><div id=v><button type=button onclick="b^=1"><kbd>d</kbd>🤏🐛</button><p><pre>${`${readFileSync(
              "log"
            )}`.replace(/(?<=^|\n)\d+: .*?(?:\n⚠([0-9]+)|$)/gs, (_, time) =>
              time
                ? new Date(+time).toLocaleString(locale, {
                    timeZoneName: "short",
                  })
                : ""
            )}</div><script>onkeydown=({key})=>{if(key=="d")document.querySelector("button").click()}
let b,t,n,u,p=-new Date("1970T00:00"),s=${bot.readyTimestamp}+p
function l(){let x=new XMLHttpRequest()
x.open("GET",\`\${b?'d':'e'}\${Intl.DateTimeFormat().resolvedOptions().timeZone}\`)
x.onload=({srcElement:{responseText}})=>{document.querySelector("#v pre").innerText=responseText.replace(/.+?\\n/,a=>{r.innerText=a
return""}).replace(/.+?\\n/,c=>{g.innerText=c
return""}).replace(/.+?\\n/,c=>{p.innerText=c.slice(0,-1)
return""}).replace(/.+?\\n/,t=>{u.innerText=new Date(+t).toLocaleString()
s=+t+p
return""}).replace(/.*?\\n/,p=>{a.innerText=p
return""})}
x.send()}
document.onvisibilitychange=()=>{if(document.visibilityState=="hidden"){clearInterval(n)
clearInterval(u)}
else {n=setInterval(l,5e3)
d.onmouseout()}}
document.querySelector('tr:nth-child(3) td').textContent=new Date(${
              bot.readyTimestamp
            }).toLocaleString()
let y=new Date().getFullYear()
setInterval(()=>{document.querySelector('tr:nth-child(4) td').innerText=new Date(Date.now()-s).toLocaleTimeString(0,{hourCycle:"h23"})},1e3)
n=setInterval(l,5e3)
d.innerHTML=document.querySelector("meta[name^=d").content.replace(/&lt;t:(\\d+)(:[tdf])?&gt;/gi,(_,t,[,m])=>{const d=Date.prototype.toLocaleString.bind(new Date(+t),0)
return\`<abbr title="\${d({timeStyle:"short",dateStyle:"full"})}">\${d({timeStyle:{t:"short",T:"long"}[m],dateStyle:{d:"short",D:"long"}[m]})}</abbr>\`})
let f=new Intl.RelativeTimeFormat()
;(d.onmouseout=()=>u=setInterval(()=>d.innerHTML=d.innerHTML.replace(/&lt;t:(\\d+):R&gt;/g,(_,t)=>{t*=1000
const r=t-Date.now()
return\`<abbr title="\${new Date(+t).toLocaleString(0,{timeStyle:"short",dateStyle:"full"})}">\${r<-31536e6?f.format(r/31536e6,"year"):r<-7884e6?f.format(r/7884e6,"quarter"):r<-2628e6?f.format(r/2628e6,"month"):r<-6048e5?f.format(r/6048e5,"week"):r<-864e5?f.format(r/864e5,"day"):r<-36e5?f.format(r/36e5,"hour"):r<-6e4?f.format(r/6e4,"minute"):f.format(r/1e3,"second")}</abbr>\`}),1))()
d.onmouseover=()=>clearInterval(u)
</script>`
      );
    }).listen(80, "", () =>
      console.log(
        `${user.tag} is alive! Hit enter at any time to update user and application info to show on the website`
      )
    );
    process.stdin.on("data", fetchData);
  });
};
if (__dirname == process.cwd()) {
  const { Client, User, ClientApplication } = require("discord.js"),
    bot = new Client({ intents: 0 });
  module.exports(bot);
  bot.login();
}
