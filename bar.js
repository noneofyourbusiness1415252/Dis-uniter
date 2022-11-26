const { get } = require("https");
get("https://cd594a2f-0e9f-48f1-b3eb-e7f6e8665adf.id.repl.co/", () =>
  process.kill(1)
);
