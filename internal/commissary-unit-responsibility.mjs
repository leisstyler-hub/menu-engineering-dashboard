/**
 * Internal-only downstream routing metadata.
 *
 * This module intentionally lives outside src/, public/, and api/. Never import it
 * into browser code or expose it through a public route, client export, or UI.
 */

export const COMMISSARY_RESPONSIBLE_CHEFS = Object.freeze({
  "jordan-gheen": Object.freeze({
    id: "jordan-gheen",
    displayName: "Jordan Gheen",
    title: "Executive Chef, Commissary Program",
  }),
});

const unitResponsibility = [
  ["50360", "SEA 58 - APOLLO MKT"],
  ["35983", "SEA90 - ATLAS CAFE"],
  ["30783", "SEA53 - BRAZIL COFFEE"],
  ["22472", "SEA20 - CRICKET CAFE"],
  ["28675", "SEA27 - DAWSON CAFE"],
  ["28676", "SEA27 - DAWSON COFFEE"],
  ["28673", "SEA24 - FIONA COFFEE"],
  ["30529", "SEA58 - KUMO CAFE"],
  ["30159", "SEA39 - NESSIE CAFE"],
  ["28672", "SEA29 - ARIZONA COFFEE"],
  ["28674", "SEA21 - PATH TO YES COFFEE"],
  ["28671", "SEA37 - ROXANNE COFFEE"],
  ["35982", "SEA86 - TRIUMPH COFFEE"],
  ["30871", "SEA41 - DAY 1 CAFE"],
  ["35981", "SEA41 - DAY 1 COFFEE"],
  ["30786", "SEA40 - DOPPLER CAFE"],
  ["30787", "SEA40 - DOPPLER CATERING"],
  ["31508", "SEA40 - DOPPLER COFFEE"],
  ["30788", "SEA40 - DOPPLER MKT"],
  ["53166", "SEA44 - FRONTIER CAFE"],
  ["53167", "SEA44 - FRONTIER COFFEE"],
  ["53168", "SEA44 - FRONTIER MKP"],
  ["51641", "SEA43 - NITRO N CAFE"],
  ["51642", "SEA43 - NITRO N COFFEE"],
  ["51643", "SEA43 - NITRO N MKT"],
  ["47622", "SEA42 - REINVENT CAFE"],
  ["47620", "SEA42 - REINVENT CATERING"],
  ["47621", "SEA42 - REINVENT COFFEE"],
];

export const COMMISSARY_UNIT_RESPONSIBILITY = Object.freeze(
  unitResponsibility.map(([profitCenter, unitName]) => Object.freeze({
    profitCenter,
    unitName,
    responsibleChefId: "jordan-gheen",
  })),
);

export const COMMISSARY_UNIT_RESPONSIBILITY_BY_PROFIT_CENTER = Object.freeze(
  Object.fromEntries(COMMISSARY_UNIT_RESPONSIBILITY.map((entry) => [entry.profitCenter, entry])),
);

export function commissaryResponsibilityForProfitCenter(value) {
  const profitCenter = String(value ?? "").trim();
  const assignment = COMMISSARY_UNIT_RESPONSIBILITY_BY_PROFIT_CENTER[profitCenter];
  if (!assignment) return null;

  return Object.freeze({
    ...assignment,
    responsibleChef: COMMISSARY_RESPONSIBLE_CHEFS[assignment.responsibleChefId],
  });
}
