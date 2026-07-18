const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

console.log(`[${formatter.format(new Date()).replace(/\s+/g, " ")}]`);
