const PATTERNS = {
  greenhouse: /(?:job-boards|boards)\.(?:eu\.)?greenhouse\.io/,
  ashby: /jobs\.ashbyhq\.com/,
  lever: /jobs\.lever\.co/,
};

export function detectPlatform(url) {
  for (const [platform, re] of Object.entries(PATTERNS)) {
    if (re.test(url)) return platform;
  }
  return "generic";
}
