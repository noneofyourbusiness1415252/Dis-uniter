const { createServer } = require("http"),
  { readFileSync } = require("fs"),
  { version, name } = require("./package.json"),
  ramLimit = +`${readFileSync("/sys/fs/cgroup/memory/memory.limit_in_bytes")}`,
  logger = new (require("./utils").Logger)();
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
  bot.on("warn", logger.error.bind(logger));
  bot.on("error", ({ message }) => logger.error(message));
  bot.on("debug", logger.debug.bind(logger));
  bot.on("interactionCreate", (interaction) => logger.debug(interaction));
  bot.once("ready", async () => {
    await fetchData(false);
    const { application, user, presence } = bot;
    createServer(({ url, headers }, res) => {
      let locale;
      try {
        locale = new Intl.Locale(headers["accept-language"]?.match(/[^,]*/));
      } catch {}
      const ramAvailable = () =>
          (
            ramLimit -
            `${readFileSync("/sys/fs/cgroup/memory/memory.usage_in_bytes")}`
          ).toLocaleString(locale, { notation: "compact" }),
        [, path] = url,
        info = () =>
          `${ramAvailable()}
${bot.guilds.cache.size.toLocaleString(locale, { notation: "compact" })}
${bot.ws.ping.toLocaleString(locale)}
${bot.readyTimestamp}
${presence.activities}
`,
        localiseTime = (time) =>
          new Date(+time).toLocaleString(locale, {
            timeZone,
          });
      /**@type{User}*/ owner =
        application.owner.owner?.user ?? application.owner;
      res
        .setHeader("X-Content-Type-Options", "nosniff")
        .setHeader("Content-Type", "text/plain;charset=utf-8")
        .setHeader("Cache-Control", "no-cache");
      let timeZone,
        formatDate = (date) => date.toISOString(),
        timeZoneName = "short";
      try {
        if (path == "?") {
          timeZone = url.slice(2);
          res.end(
            `${info()}${`${readFileSync("log")}`.replace(
              /(?<=^⚠?)\d+/gm,
              localiseTime
            )}`
          );
          return;
        }
        if (path && path != ".") {
          timeZone = url.slice(1);
          res.end(
            `${info()}${`${readFileSync("log")}`
              .replace(/(?<=^|\n)\d+: .*?\n(?=⚠|$)/gs, "")
              .replace(/(?<=^⚠?)\d+/gm, localiseTime)}`
          );
          return;
        }
      } catch ({ name, message }) {
        res
          .writeHead(404, name, { "Cache-Control": "max-age=180" })
          .end(message);
        return;
      }
      if (locale) {
        formatDate = (date) =>
          date.toLocaleString(locale, { timeZone, timeZoneName });
        try {
          let { timeZones } = new Intl.Locale(locale);
          if (timeZones.length == 1) {
            [timeZone] = timeZones;
            timeZoneName = undefined;
          }
        } catch {}
      }
      res
        .setHeader("Content-Type", "text/html;charset=utf-8")
        .setHeader("Cache-Control", "max-age=180").end(html`<!DOCTYPE
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
content=${user.avatarURL({ size: 4096 })}><title>${user.tag}</title><link
rel=icon
href=${user.displayAvatarURL({ size: 16 })}><link rel=stylesheet
href=//d.umarismyname.repl.co/v1/.css><script
onload=f(${bot.readyTimestamp})
defer
src=//d.umarismyname.repl.co/v2/.js></script><html
lang=en><div
id=o><h1>${user.tag}<img
width=32
height=32
src=${bot.user.avatarURL({ size: 32 })}
alt><span
id=s>${
        { online: "🟢", offline: "⭕", idle: "⏰", dnd: "⛔" }[presence.status]
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
src=${owner.displayAvatarURL({ size: 16 })}
alt><a
href=//discord.com/users/${owner.id}>${owner.tag.replace(/#0$/g, "")}${
        owner.banner
          ? html`<img src=${owner.bannerURL({ size: 16 })}
alt>`
          : ""
      }<tr><th
title=RAM>🆓🔀🧠<td><span
class=i
id=r>${ramAvailable()}</span></table>${install}<p></div><div
id=v><button
type=button><kbd>d</kbd>🤏🐛</button><p><pre>${`${readFileSync("log")}`
        .replace(/(?<=^|\n)\d+: .*?\n(?=⚠|$)/gs, "")
        .replace(/(?<=^⚠?)\d+/gm, localiseTime)}</div>`);
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
