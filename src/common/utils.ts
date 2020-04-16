export const escapeStringTemplateTicks = (str: string) => str.replace(/`/g, `\\\``); // lgtm [js/incomplete-sanitization]
