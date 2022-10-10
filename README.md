![npm bundle size](https://img.shields.io/bundlephobia/minzip/replit-dis-uniter) ![GitHub package.json version](https://img.shields.io/github/package-json/v/noneofyourbusiness1415252/dis-uniter)
This does literally everything needed to keep your bot alive on replit. It creates a website that displays info about your bot. Set it up quickly by running in shell (accessed through commands tab on mobile):

```bash
sed -i '/^\s*client.login(/s/^\s/require("replit-dis-uniter")(client);\n/' *.js
```

[Here](https://626110f0-d408-475b-9830-1d15b93582e1.id.repl.co) is a website of a bot kept alive by this package
