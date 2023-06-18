import t from "ava";
import { createRequire } from "module";
import { readFileSync, writeFileSync, appendFileSync } from "fs";
const { debug, error } = createRequire(import.meta.url)(".");
let get_logs = () => `${readFileSync("log")}`;
writeFileSync("log", `${Date.now() - 865e5}: foo\n`);
debug("foo");
t("debug log", (t) => t.regex(get_logs(), /\d+: foo\n$/));
error("foo");
let logs = get_logs();
t("error output", (t) => {
  t.regex(logs, /⚠\d+: foo\n$/);
});
t("valid timestamp", (t) =>
  t.true(logs.match(/⚠(\d+).*\n$/)?.[1] > Date.now() - 864e5)
);
