import { useSsmtDialog } from "./ssmtDialog.js";
import React, { useState, useMemo } from "react";
import {
  FOOD_TYPES,
  PROTEINS,
  approvedMatches,
  generateFixy,
  groupsForItem,
  importItems,
  isDuplicateItem,
  loadGroups,
  replaceConcept,
} from "./ssmtReuse.js";
const button =
  "rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 disabled:opacity-40";
const input =
  "w-full rounded border border-slate-300 bg-white p-2 text-slate-900";
export default function SsmtReusePanel({
  mode,
  menus,
  menu,
  item,
  groups,
  onApply,
  onClose,
  onChooseItem,
}) {
  const dialogRef = useSsmtDialog(onClose);
  const [sourceId, setSourceId] = useState(""),
    [sourceItemId, setSourceItemId] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState([]),
    [allowCopies, setAllowCopies] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(null);
  const [facts, setFacts] = useState({
    business: "R",
    type: "",
    service: "",
    protein: "unknown",
    cafeSoup12Fo: false,
  });
  const [matchIndex, setMatchIndex] = useState("");
  const sourceMenus = mode === "items" ? menus.filter(m => m.phase === "IT complete") : menus;
  function itemIssue(candidate) {
    try { replaceConcept(candidate.fohColumn, "REVIEW"); return ""; }
    catch { return "Source FIXY missing or malformed. Correct it in the source menu before importing."; }
  }
  const source = menus.find((m) => m.id === sourceId),
    sourceItem = source?.items.find((i) => i.id === sourceItemId);
  const catalog = useMemo(
    () =>
      mode === "groups"
        ? menus.flatMap((m) =>
            (m.items || [])
              .filter((i) => i.rowType !== "divider")
              .flatMap((i) =>
                groupsForItem(i, groups, m).map((group) => ({
                  group,
                  menu: m,
                  item: i,
                })),
              ),
          )
        : [],
    [mode, menus, groups],
  );
  const seen = new Set();
  const candidates = catalog
    .filter(
      (c) =>
        (!sourceId || c.menu.id === sourceId) &&
        (!sourceItemId || c.item.id === sourceItemId) &&
        `${c.group.name} ${c.group.alias || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .filter((c) => {
      if (seen.has(c.group.id)) return false;
      seen.add(c.group.id);
      return true;
    });
  const matches = mode === "fixy" && item ? approvedMatches(item, menus) : [];
  const toggle = (id) => {
    setPreview(null);
    setSelected((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
    );
  };
  function prepare() {
    try {
      setError("");
      if (mode === "items") {
        if (!source || !selected.length)
          throw new Error("Select a source menu and at least one item.");
        const result = importItems(source, menu, selected, groups, allowCopies);
        setPreview(result);
      } else if (mode === "groups") {
        if (!selected.length)
          throw new Error("Select at least one modifier group.");
        const loaded = loadGroups(
          [
            ...new Map(
              catalog
                .filter((c) => selected.includes(c.group.id))
                .map((c) => [c.group.id, c.group]),
            ).values(),
          ],
          groupsForItem(item, groups, menu),
          allowCopies,
        );
        if (groupsForItem(item, groups, menu).length + loaded.length > 10)
          throw new Error("An item supports at most 10 modifier groups.");
        setPreview({ groups: loaded });
      } else {
        if (!menu.items.some((i) => i.rowType !== "divider"))
          throw new Error(
            "This menu has zero items. Add an item before generating FIXY.",
          );
        if (!menu.fixyDesignation?.trim())
          throw new Error(
            "Enter this menu’s FIXY designation before generating.",
          );
        if (item.lockedForCentric)
          throw new Error("Unlock the item before changing its FIXY.");
        const value =
          matchIndex !== ""
            ? replaceConcept(
                matches[Number(matchIndex)].item.fohColumn,
                menu.fixyDesignation,
              )
            : generateFixy(item, menu, facts);
        setPreview({ fixy: value });
      }
    } catch (e) {
      setError(e.message);
      setPreview(null);
    }
  }
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === "items"
          ? "Add from Menu"
          : mode === "groups"
            ? "Load Modifier Groups"
            : "Generate FIXY"
      }
      className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/60 p-4"
    >
      <section className="mx-auto my-8 max-w-3xl space-y-4 rounded-xl bg-white p-5 text-slate-950 shadow-xl">
        <div className="flex justify-between gap-4">
          <h2 className="text-xl font-black">
            {mode === "items"
              ? "Add from Menu"
              : mode === "groups"
                ? "Load Modifier Groups"
                : "Generate FIXY"}
          </h2>
          <button className={button} onClick={onClose}>
            Close
          </button>
        </div>
        {mode !== "fixy" && (
          <>
            <label className="block">
              Source menu
              <select
                aria-label="Source menu"
                className={input}
                value={sourceId}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  setSourceItemId("");
                  setSelected([]);
                  setPreview(null);
                }}
              >
                <option value="">
                  {mode === "groups" ? "All menus" : "Select menu"}
                </option>
                {sourceMenus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            {mode === "items" && <p className="text-sm">Only IT complete menus are available. Items need a valid source FIXY before importing.</p>}
            {mode === "groups" && (
              <>
                <label className="block">
                  Source item
                  <select
                    aria-label="Source item"
                    className={input}
                    value={sourceItemId}
                    onChange={(e) => {
                      setSourceItemId(e.target.value);
                      setSelected([]);
                      setPreview(null);
                    }}
                  >
                    <option value="">All items</option>
                    {source?.items
                      .filter((i) => i.rowType !== "divider")
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label || i.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block">
                  Search group name or shared alias
                  <input
                    className={input}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPreview(null);
                    }}
                  />
                </label>
              </>
            )}
            <div className="max-h-80 space-y-2 overflow-y-auto rounded border p-3">
              {mode === "items" ? (
                <>
                  {source && (
                    <button
                      className={button}
                      onClick={() => {
                        setSelected(
                          source.items
                            .filter((i) => i.rowType !== "divider" && !itemIssue(i))
                            .map((i) => i.id),
                        );
                        setPreview(null);
                      }}
                    >
                      Select whole menu
                    </button>
                  )}
                  {source?.items
                    .filter((i) => i.rowType !== "divider")
                    .map((i) => (
                      <label key={i.id} className="block border-b py-2">
                        <input
                          type="checkbox"
                          disabled={Boolean(itemIssue(i))}
                          checked={selected.includes(i.id)}
                          onChange={() => toggle(i.id)}
                        />{" "}
                        {i.label || i.name} —{" "}
                        {i.fohColumn || "FIXY missing: review required"} — price{" "}
                        {i.seaPrice ?? "blank"}{" "}
                        {itemIssue(i) && <span className="block text-sm font-bold text-red-700">{itemIssue(i)}</span>}
                        {isDuplicateItem(i, menu) && (
                          <strong> • Duplicate: skipped by default</strong>
                        )}
                      </label>
                    ))}
                </>
              ) : (
                candidates.map((c) => (
                  <label key={c.group.id} className="block border-b py-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.group.id)}
                      onChange={() => toggle(c.group.id)}
                    />{" "}
                    <strong>{c.group.name}</strong>{" "}
                    {c.group.alias && `(${c.group.alias})`}
                    <span className="block text-sm">
                      {c.menu.name} / {c.item.label || c.item.name} •{" "}
                      {c.group.type} • min {c.group.minQty || "blank"} / max{" "}
                      {c.group.maxQty || "blank"}
                    </span>
                    <span className="block text-xs">
                      {(c.group.choices || [])
                        .map(
                          (c) =>
                            `${c.label || c.name} (${c.price ?? c.seaPrice ?? c.priceSelector ?? "blank"})`,
                        )
                        .join(", ")}
                    </span>
                  </label>
                ))
              )}
            </div>
            <label className="block">
              <input
                type="checkbox"
                checked={allowCopies}
                onChange={(e) => {
                  setAllowCopies(e.target.checked);
                  setPreview(null);
                }}
              />{" "}
              Explicitly add additional copies of duplicates
            </label>
          </>
        )}
        {mode === "fixy" && (
          <>
            <label className="block">
              Item
              <select
                aria-label="FIXY item"
                className={input}
                value={item?.id || ""}
                onChange={(e) =>
                  onChooseItem(menu.items.find((i) => i.id === e.target.value))
                }
              >
                {menu.items
                  .filter((i) => i.rowType !== "divider")
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label || i.name}
                    </option>
                  ))}
              </select>
            </label>
            <p className="text-sm">
              Destination designation:{" "}
              <strong>{menu.fixyDesignation || "Missing"}</strong>. Match first;
              classify second; create last. Confirm portion and selling format
              before reusing a candidate.
            </p>
            <label className="block">
              Approved completed-menu candidates
              <select
                className={input}
                value={matchIndex}
                onChange={(e) => {
                  setMatchIndex(e.target.value);
                  setPreview(null);
                }}
              >
                <option value="">NEW — provide confirmed facts below</option>
                {matches.map((m, index) => (
                  <option key={`${m.menuId}-${m.item.id}`} value={index}>
                    POSSIBLE MATCH — {m.menuName}: {m.item.fohColumn} / MRN{" "}
                    {m.item.mrn} / {m.item.description}
                  </option>
                ))}
              </select>
            </label>
            {matchIndex === "" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [
                    "business",
                    "Business",
                    {
                      R: "Restaurant",
                      C: "Catering",
                      M: "Market",
                      V: "Vending",
                    },
                  ],
                  ["type", "Food type", FOOD_TYPES],
                  [
                    "service",
                    "Serving role",
                    { ENT: "Entrée", SNK: "Side / Snack" },
                  ],
                  ["protein", "Protein", PROTEINS],
                ].map(([field, label, options]) => (
                  <label key={field}>
                    {label}
                    <select
                      aria-label={label}
                      className={input}
                      value={facts[field]}
                      onChange={(e) => {
                        setFacts({ ...facts, [field]: e.target.value });
                        setPreview(null);
                      }}
                    >
                      {field !== "business" && (
                        <option value={field === "protein" ? "unknown" : ""}>
                          Confirm {label.toLowerCase()}
                        </option>
                      )}
                      {Object.entries(options).map(([code, name]) => (
                        <option key={code} value={code}>
                          {code} {name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={facts.cafeSoup12Fo}
                    onChange={(e) => {
                      setFacts({ ...facts, cafeSoup12Fo: e.target.checked });
                      setPreview(null);
                    }}
                  />{" "}
                  Confirmed Cafe Express soup, sold as 12 fluid ounces (special
                  naming convention)
                </label>
              </div>
            )}
            <p className="text-sm">
              Current FIXY: {item?.fohColumn || "blank"}. Applying explicitly
              replaces this value.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="font-bold text-red-700">
            {error}
          </p>
        )}
        <button className={button} onClick={prepare}>
          Preview {mode === "fixy" ? "FIXY" : "copies"}
        </button>
        {preview && (
          <div className="space-y-3 rounded border border-emerald-300 bg-emerald-50 p-3">
            <h3 className="font-black">Review before applying</h3>
            {preview.fixy ? (
              <p>{preview.fixy}</p>
            ) : (
              <>
                <p>
                  {preview.items?.length ?? 0} items / {preview.groups.length}{" "}
                  independent modifier groups. Skipped duplicates are excluded.
                </p>
                {preview.items?.map((i) => (
                  <p key={i.id}>
                    {i.label || i.name}: {i.fohColumn} • MRN {i.mrn} • price{" "}
                    {i.seaPrice ?? "blank"}
                  </p>
                ))}
                {preview.groups.map((g) => (
                  <p key={g.id}>
                    {g.name} • {g.choices?.length || 0} options
                  </p>
                ))}
              </>
            )}
            <button
              className={button}
              disabled={
                !preview.fixy &&
                !preview.items?.length &&
                !preview.groups?.length
              }
              onClick={() => {
                onApply(preview);
                onClose();
              }}
            >
              Apply {mode === "fixy" ? "FIXY" : "copies"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
