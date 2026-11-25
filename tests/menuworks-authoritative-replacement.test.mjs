import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthoritativeMenuReplacement, menuWorksReplacementIdentity, replacementProfileSummary } from "../src/features/recipe-database/menuWorksAuthoritativeReplacement.js";

test("authoritative replacement preserves exact identities/profiles and removes missing rows", () => {
  const reviewed = { reviewStatus: "Reviewed", cuisineMoniker: ["Mediterranean"] };
  const current = [
    { item_key: "kept", menu: "AMZ: Test", station: "Deli", mrn: "1.20", portion: "1 each", item: "Old name", enticingDescription: "Reviewed description", culinaryProfile: reviewed },
    { item_key: "deleted", menu: "AMZ: Test", station: "Deli", mrn: "2", portion: "1 each", item: "Deleted" },
  ];
  const incoming = [
    { menu: "AMZ: Test", station: "Deli", mrn: "1.20", portion: "1 each", item: "Updated name", enticingDescription: "" },
    { menu: "AMZ: Test", station: "Deli", mrn: "3", portion: "1 each", item: "Added" },
  ];
  const result = buildAuthoritativeMenuReplacement(incoming, current, { version: "v1", fileName: "source.csv", sha256: "abc" });
  assert.equal(result.rows[0].item_key, "kept");
  assert.equal(result.rows[0].enticingDescription, "Reviewed description");
  assert.equal(result.rows[0].culinaryProfile, reviewed);
  assert.equal(result.removed[0].item_key, "deleted");
  assert.equal(result.rows[1].culinaryProfile.reviewStatus, "Needs review");
  assert.equal(result.rows[1].culinaryProfile.provenance.sourceSha256, "abc");
  assert.deepEqual(replacementProfileSummary(result.rows), { rows: 2, storedProfiles: 2, reviewedProfilesPreserved: 1, needsReviewProfiles: 1, missingProfiles: 0 });
});

test("portion variants remain distinct even when MRNs match", () => {
  const one = { menu: "AMZ: Test", station: "BYO", mrn: "5294.29", portion: "1 oz" };
  const four = { ...one, portion: "4 oz" };
  assert.notEqual(menuWorksReplacementIdentity(one), menuWorksReplacementIdentity(four));
  const result = buildAuthoritativeMenuReplacement([one, four], [], { version: "v1", fileName: "source.csv", sha256: "abc" });
  assert.equal(new Set(result.rows.map(({ item_key }) => item_key)).size, 2);
});
