This does literally everything needed to keep your bot alive on replit. It creates a website that displays info about your bot. Example usage:
```js
const { Client, Intents } = require("discord.js"),
  client = new Client({ intents: [Intents.FLAGS.GUILDS] });
require("replit-dis-uniter")(client);
client.login();
```
[Here](https://dis-uniter.umarismyname.repl.co/) is a website of a bot kept alive by this package