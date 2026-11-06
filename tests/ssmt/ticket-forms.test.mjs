import test from "node:test";
import assert from "node:assert/strict";
import { ssmtTicketForPhase } from "../../src/features/ssmt/ssmtTicketForms.js";

test("ticket defaults preserve exact menu values and omit requestor and unverified choices", () => {
  const menu = {id:"menu",name:"Soup & Salad / 2026",centricMenuName:"CENTRIC 001",fixyDesignation:"00042.10",activeStart:"2026-12-01",type:"Promotion"};
  for (const phase of ["Experience review", "IT programming"]) {
    const ticket = ssmtTicketForPhase(menu, phase);
    const url = new URL(ticket.href);
    assert.equal(url.origin, "https://app.smartsheet.com");
    assert.equal(ticket.menuId, menu.id);
    assert.match(url.searchParams.get(phase === "Experience review" ? "Long Details" : "Please explain further."), /00042\.10/);
    for (const key of ["Requestor Name", "Requestor Email", "Your Email", "Onsite Contact Name", "Onsite Contact Phone Number", "Project Group", "Priority Level", "What can we assist you with?"]) assert.equal(url.searchParams.has(key), false);
    if (phase === "Experience review") assert.equal(url.searchParams.get("Project Name"),menu.name);
    else {
      assert.equal(url.searchParams.get("Centric Menu Name"), menu.centricMenuName);
      assert.equal(url.searchParams.get("Menu Change Launch Date"), menu.activeStart);
    }
  }
  const unset = new URL(ssmtTicketForPhase({id:"x",name:"Unmapped"},"IT programming").href);
  assert.equal(unset.searchParams.has("Centric Menu Name"),false);
  assert.equal(unset.searchParams.has("Menu Change Launch Date"),false);
  assert.equal(ssmtTicketForPhase(menu,"IT complete"),null);
  assert.equal(ssmtTicketForPhase(menu,"Culinary draft"),null);
});
