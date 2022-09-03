This does literally everything needed to keep your bot alive on replit. It creates a website that displays info about your bot. Example usage:

```js
const { Client, GatewayIntentBits } = require("discord.js"),
  client = new Client({ intents: [GatewayIntentBits.Guilds] });
require("replit-dis-uniter")(client);
client.login();
```

[Here](https://626110f0-d408-475b-9830-1d15b93582e1.id.repl.co) is a website of a bot kept alive by this package
