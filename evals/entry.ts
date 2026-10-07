import { main } from "./cli";
import { redact } from "./options";

main(process.argv.slice(2), process.env).then(code => {
  process.exitCode = code;
}).catch(error => {
  const message = error instanceof Error ? error.message : "Evaluation command failed.";
  console.error(redact(message, [process.env.ANTHROPIC_API_KEY, process.env.GITHUB_TOKEN]));
  process.exitCode = 2;
});
