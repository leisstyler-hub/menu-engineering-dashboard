const EXPERIENCE_FORM = "https://app.smartsheet.com/b/form/bb4da0b6130d4cfba2832e7dda6919ab";
const IT_FORM = "https://app.smartsheet.com/b/form/efc2cf544e664e50863f21c7b156335a";

// Field labels were read from each public form definition. Requestor/contact
// fields intentionally stay blank: the submitter may be someone else.
export function ssmtTicketForPhase(menu, phase) {
  if (!["Experience review", "IT programming"].includes(phase)) return null;
  const experience = phase === "Experience review";
  const url = new URL(experience ? EXPERIENCE_FORM : IT_FORM);
  const details = [`SSMT menu: ${menu.name}`, menu.type && `Menu type: ${menu.type}`, menu.fixyDesignation && `FIXY designation: ${menu.fixyDesignation}`, "Review the selected menu in Culinary Tools: https://project-d8v25.vercel.app/"].filter(Boolean).join("\n");
  if (experience) {
    url.searchParams.set("Project Name", menu.name || "");
    url.searchParams.set("Summary & Objective", `Experience review for ${menu.name || "SSMT menu"}: review menu descriptions and modifiers before IT programming.`);
    url.searchParams.set("Long Details", details);
  } else {
    if (menu.centricMenuName) url.searchParams.set("Centric Menu Name", menu.centricMenuName);
    url.searchParams.set("Please explain further.", `SSMT menu ready for IT programming.\n${details}`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(menu.activeStart || "")) url.searchParams.set("Menu Change Launch Date", menu.activeStart);
  }
  return { menuId: menu.id, label: experience ? "Experience" : "IT", href: url.href };
}
