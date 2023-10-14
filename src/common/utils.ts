export const escapeStringTemplateTicks = (str: string) => str.replace(/`/g, `\\\``); // lgtm [js/incomplete-sanitization]

export const parseHeaderFlag = (headerFlag: string[]) => {
  const headers = {};
  for (const header of headerFlag || []) {
    const [name, value] = header.split(':');
    headers[name.trim()] = value.trim();
  }
  return headers;
};

export const isValidJson = (jsonString: string) => {
  try {
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}