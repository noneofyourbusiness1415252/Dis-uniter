const { createServer } = require("http"),
  { readFileSync } = require("fs"),
  { version, name } = require("./package.json"),
  css = String.raw,
  html = css,
  ramLimit = +`${readFileSync("/sys/fs/cgroup/memory/memory.limit_in_bytes")}`,
  { debug, error } = require("./utils");
let HTMLDescription, install;
module.exports = (/**@type{Client<false>}*/ bot) => {
  async function fetchData(force) {
    await bot.application.fetch();
    await bot.user.fetch({ force });
    /**@type{{application:ClientApplication}}*/ const {
      application: { owner, installParams, customInstallURL, description, id },
    } = bot;
    (owner.owner?.user ?? owner).fetch({ force });
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
  bot.on("warn", error);
  bot.on("error", ({ message }) => error(message));
  bot.on("debug", debug);
  bot.on("interactionCreate", debug);
  bot.once("ready", async () => {
    await fetchData(false);
    const { application, user, presence } = bot;
    createServer(({ url, headers }, res) => {
      const locale = headers["accept-language"]?.match(/[^,]+/)?.[0],
        ramAvailable = () =>
          (
            ramLimit -
            `${readFileSync("/sys/fs/cgroup/memory/memory.usage_in_bytes")}`
          ).toLocaleString(locale, { notation: "compact" }),
        path = url[1],
        localiseTime = (time) =>
          new Date(+time).toLocaleString(locale, {
            timeZone: url.slice(2),
          }),
        info = () =>
          `${ramAvailable()}
${bot.guilds.cache.size.toLocaleString(locale)}
${bot.ws.ping.toLocaleString(locale)}
${bot.readyTimestamp}
${presence.activities}
`,
        /**@type{User}*/ owner =
          application.owner.owner?.user ?? application.owner;
      res.writeHead(200, {
        "Content-Type":
          { js: "text/javascript", css: "text/css" }[url.slice(2)] ??
          `text/html;charset=utf-8`,
        "Cache-Control":
          { ".": "max-age=31536000", "": "max-age=180" }[path] ?? "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      let timeZone,
        formatDate = (date) => date.toISOString(),
        timeZoneName = "short";
      if (!path && locale) {
        formatDate = (date) =>
          date.toLocaleString(locale, { timeZone, timeZoneName });
        let { timeZones } = new Intl.Locale(locale);
        if (timeZones.length == 1) {
          [timeZone] = timeZones;
          timeZoneName = undefined;
        }
      }
      res.end(
        path == "e"
          ? `${info()}${`${readFileSync("log")}`.replace(
              /(?<=^|\n)\d+: .*?(?:\n⚠([0-9]+)|$)/gs,
              (_, time) => (time ? localiseTime(time) : "")
            )}`
          : path == "d"
          ? `${info()}${`${readFileSync("log")}`.replace(
              /(?<=^⚠?)\d+/gm,
              localiseTime
            )}`
          : url.endsWith("js")
          ? `export default function(w){
onkeydown=({key})=>{if(key=="d")v.querySelector("*").click()}
let
b,t,n,m,e=-new
Date("1970T00:00"),s=w+e
async function
l(){v.querySelector("pre").innerText=(await(await
fetch(\`\${b?'d':'e'}\${Intl.DateTimeFormat().resolvedOptions().timeZone}\`)).text()).replace(/.+?\\n/,a=>{r.innerText=a
return""}).replace(/.+?\\n/,c=>{g.innerText=c
return""}).replace(/.+?\\n/,c=>{p.innerText=c.slice(0,-1)
return""}).replace(/.+?\\n/,t=>{t/=1
u.innerText=new
Date(t).toLocaleString()
s=t+e
return""}).replace(/.*?\\n/,p=>{a.innerText=p
return""})}
document.onvisibilitychange=()=>{if(document.visibilityState=="hidden"){clearInterval(n)
clearInterval(m)}
else{n=setInterval(l,5e3)
d.onmouseout()}}
let
y=new
Date().getFullYear()
setInterval(()=>{o.querySelector(":nth-child(4)>td").innerText=new
Date(Date.now()-s).toLocaleTimeString(0,{hourCycle:"h23"})},1e3)
n=setInterval(l,5e3)
d.innerHTML=document.querySelector("meta[name^=d").content.replace(/&lt;t:(\\d+)(:[tdf])?&gt;/gi,(_,t,[,m])=>{const
d=Date.prototype.toLocaleString.bind(new
Date(+t),0)
return\`<abbr
title="\${d({timeStyle:"short",dateStyle:"full"})}">\${d({timeStyle:{t:"short",T:"long"}[m],dateStyle:{d:"short",D:"long"}[m]})}</abbr>\`})
let
f=Intl.RelativeTimeFormat.prototype.format.bind(new
Intl.RelativeTimeFormat())
d.onmouseover=()=>clearInterval(m);(d.onmouseout=()=>m=setInterval(()=>d.innerHTML=d.innerHTML.replace(/&lt;t:(\\d+):R&gt;/g,(_,t)=>{t*=1000
const
r=t-Date.now()
return\`<abbr
title="\${new
Date(+t).toLocaleString(0,{timeStyle:"short",dateStyle:"full"})}">\${r<-31536e6?f(r/31536e6,"year"):r<-7884e6?f(r/7884e6,"quarter"):r<-2628e6?f(r/2628e6,"month"):r<-6048e5?f(r/6048e5,"week"):r<-864e5?f(r/864e5,"day"):r<-36e5?f(r/36e5,"hour"):r<-6e4?f(r/6e4,"minute"):f(r/1e3,"second")}</abbr>\`}),1))()}`
          : url.endsWith("css")
          ? css`*{text-align:center;margin:0
auto}blockquote>*{border-right:4px
solid
#007acc80;border-left:4px
solid
#007acc80;display:inline;padding:4px
4px;border-radius:1px}#s{font-size:.1em}body,table{background:#FDF6E3;color:#657B83;font-family:sans-serif}button{background-color:#AC9D57}h1{color:#268BD2}@media(prefers-color-scheme:dark){body,table{background-color:#002B36;color:#839496}blockquote>*{border-color:#073642}button{background-color:#2AA19899}}img{height:1em}td{border:1px}p{white-space:pre-wrap}body{display:flex;flex-flow:row wrap;width:100vw}#o,#v{overflow:auto}#o{min-width:min-content;flex:1}#v{height:100vh;max-width:88ch}button{display:inline-block}a{color:#3794ff}.d,abbr{color:#cb4b16}.i{color:#D33682}code{color:#d7ba7d}i,b{color:#D33682}pre{white-space:pre-wrap`
          : html`<!DOCTYPE
html><meta
charset=utf-8><meta
name=viewport
content=width=device-width><meta
name=description
content='${HTMLDescription}'><meta
name=keywords
content="${application.tags}"><meta
name=generator
content="${name} ${version}"><meta
name=author
content='${owner}'><meta
name=og:image
content=${user.avatarURL({ extension: "png" })}><title>${user.tag}</title><link
rel=icon
href=${user.displayAvatarURL({
              extension: "png",
            })}><link rel=stylesheet
href=.css><script
type=module>import
f
from
'./.js'
f(${bot.readyTimestamp})</script><html
lang=en><div
id=o><h1>${user.tag}<img
src='${bot.user.avatarURL({
              extension: "png",
            })}'alt><span
id=s>${
              { online: "🟢", offline: "⭕", idle: "⏰", dnd: "⛔" }[
                presence.status
              ]
            }</h1><p
id=d><table><tr><th>Guilds<td
class=i
id=g>${bot.guilds.cache.size.toLocaleString(locale, {
              notation: "compact",
            })}<tr><th
title=latency>🏓<td><span
class=i
id=p>${bot.ws.ping.toLocaleString(locale)}</span>ms<tr><th>🎬<td
class=d
id=u>${formatDate(new Date(bot.readyTimestamp))}<tr><th>⏱️<td
class=d>${new Date(Date.now() - bot.readyTimestamp).toLocaleTimeString(locale, {
              hourCycle: "h23",
            })}<tr><th
title=activity>🎮🏆👀👂<td
id=a>${presence.activities}<tr><th>🏷️<td>${application.tags}<tr><th>👑<td><img
src=${owner.displayAvatarURL({
              extension: "png",
            })}
alt><a
href=//discord.com/users/${owner.id}>${owner.tag.replace(/#0$/g, "")}${
              owner.banner
                ? html`<img
src=${owner.bannerURL()} alt>`
                : ""
            }<tr><th
title=RAM>🆓🔀🧠<td><span
class=i
id=r>${ramAvailable()}</span></table>${install}<p></div><div
id=v><button
type=button
onclick=b^=1><kbd>d</kbd>🤏🐛</button><p><pre>${`${readFileSync(
              "log"
            )}`.replace(/(?<=^|\n)\d+: .*?(?:\n⚠([0-9]+)|$)/gs, (_, time) =>
              time ? formatDate(new Date(+time)) : ""
            )}</div>`
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
