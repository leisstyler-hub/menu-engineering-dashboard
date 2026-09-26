import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, Loader2, Settings2 } from "lucide-react";
import { getRecipeLibraryPhoto } from "../../data/recipeLibraryAssets.js";
import { normalizeRecipeLibraryItem } from "../recipe-database/recipeLibraryModel.js";

const SLOT_COUNT = 4;

const TWO_OPTION_FIELDS = ["1. Plate Appeal", "1. Plate Arrangement", "1. Plate Edges", "1. Garnish"];
const PORTION_OPTION_FIELDS = ["2. Protein Portion", "2. Side 1 Portion", "2. Side 2 Portion", "2. Sauce Portion"];
const FIVE_OPTION_FIELDS = ["3. Temperature", "3. Doneness", "3. Seasoning", "3. Flavor Balance", "3. Texture", "3. Overall Taste"];
const ALIGNED_OPTION_FIELDS = ["4. Cooking Method", "4. Ingredients", "4. Correct Sides", "4. Substitutions"];
const RATING_FIELDS = [...TWO_OPTION_FIELDS, ...PORTION_OPTION_FIELDS, ...FIVE_OPTION_FIELDS, ...ALIGNED_OPTION_FIELDS];

const NOTE_FIELDS = [
  { key: "1. Plating Notes", label: "Plating Notes" },
  { key: "2. Portion Notes", label: "Portion Notes" },
  { key: "3. Taste Notes", label: "Taste Notes" },
  { key: "4. Recipe Notes", label: "Recipe Notes" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyRatings() {
  return Object.fromEntries(RATING_FIELDS.map((field) => [field, ""]));
}

function emptyNotes() {
  return Object.fromEntries(NOTE_FIELDS.map(({ key }) => [key, ""]));
}

function emptySlots() {
  return Array.from({ length: SLOT_COUNT }, () => ({ itemKey: "", raw: null }));
}

function itemPhoto(row) {
  if (!row) return null;
  const documents = Array.isArray(row.recipe_documents) ? row.recipe_documents : [];
  const photoDocument = documents.find((document) => document?.document_type === "item-photo" && document?.is_active !== false);
  if (photoDocument?.signed_url) {
    return { src: photoDocument.signed_url, alt: row.display_name || row.recipe_name || "Menu item photo" };
  }
  const localPhoto = getRecipeLibraryPhoto(row.raw || row);
  return localPhoto ? { src: localPhoto.src, alt: localPhoto.alt || row.display_name } : null;
}

function itemLabel(row) {
  const name = row.display_name || row.recipe_name || row.short_name || "Unnamed item";
  const portion = row.portion_oz != null && row.portion_oz !== "" ? ` (${row.portion_oz} oz)` : "";
  return `${name}${portion}`;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Request to ${url} failed.`);
  }
  return payload;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected photo."));
    reader.readAsDataURL(file);
  });
}

export default function CafeTastingForm({ onBackToPlatform }) {
  const [schema, setSchema] = useState(null);
  const [schemaError, setSchemaError] = useState("");
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [slots, setSlots] = useState(emptySlots());

  const [date, setDate] = useState(todayIso());
  const [cafeName, setCafeName] = useState("");
  const [stationName, setStationName] = useState("");
  const [taster, setTaster] = useState("");
  const [dishName, setDishName] = useState("");
  const [dishNameTouched, setDishNameTouched] = useState(false);
  const [actualPortion, setActualPortion] = useState("");
  const [ratings, setRatings] = useState(emptyRatings());
  const [notes, setNotes] = useState(emptyNotes());
  const [strengths, setStrengths] = useState("");
  const [opportunities, setOpportunities] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const [showRouting, setShowRouting] = useState(false);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/smartsheet/records?dataset=cafe-tasting&diagnostic=columns")
      .then((payload) => {
        if (cancelled) return;
        setSchema(payload.rawColumns || []);
      })
      .catch((error) => {
        if (!cancelled) setSchemaError(error.message);
      });
    fetchJson("/api/recipe-library?scope=summary")
      .then((payload) => {
        if (cancelled) return;
        setMenus((payload.menus || []).map((entry) => entry.menu).filter(Boolean));
      })
      .catch(() => {});
    fetchJson("/api/smartsheet/records?dataset=cafe-tasting-routing")
      .then((payload) => {
        if (cancelled) return;
        setRoutes(payload.records || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedMenu) {
      setMenuItems([]);
      return;
    }
    let cancelled = false;
    setMenuItemsLoading(true);
    fetchJson(`/api/recipe-library?scope=menu&menu=${encodeURIComponent(selectedMenu)}`)
      .then((payload) => {
        if (cancelled) return;
        setMenuItems((payload.rows || []).map(normalizeRecipeLibraryItem));
      })
      .catch(() => {
        if (!cancelled) setMenuItems([]);
      })
      .finally(() => {
        if (!cancelled) setMenuItemsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedMenu]);

  const columnByTitle = useMemo(() => {
    const map = new Map();
    (schema || []).forEach((column) => map.set(column.title, column));
    return map;
  }, [schema]);

  const cafeOptions = useMemo(() => columnByTitle.get("Cafe Name")?.options || [], [columnByTitle]);
  const stationOptions = useMemo(() => columnByTitle.get("Station Name")?.options || [], [columnByTitle]);
  const tasterOptions = useMemo(() => columnByTitle.get("Taster")?.contactOptions || [], [columnByTitle]);
  const optionsFor = (title) => columnByTitle.get(title)?.options || [];

  const targetPortion = useMemo(() => {
    const total = slots.reduce((sum, slot) => {
      const weight = Number(slot.raw?.portion_oz);
      return Number.isFinite(weight) ? sum + weight : sum;
    }, 0);
    return total > 0 ? Math.round(total * 100) / 100 : "";
  }, [slots]);

  const routingPreview = useMemo(() => {
    const normalizedCafe = cafeName.trim().toLowerCase();
    if (!normalizedCafe) return null;
    const match = routes.find((route) => String(route.Cafe || "").trim().toLowerCase() === normalizedCafe);
    if (!match) return { found: false };
    return { found: true, chef: match["Chef Contact"] || "", director: match["Director Contact"] || "" };
  }, [cafeName, routes]);

  const autoDishName = useMemo(() => slots
    .filter((slot) => slot.raw)
    .map((slot) => slot.raw.display_name || slot.raw.recipe_name || "")
    .filter(Boolean)
    .join(" | "), [slots]);

  useEffect(() => {
    if (!dishNameTouched) setDishName(autoDishName);
  }, [autoDishName, dishNameTouched]);

  function updateSlot(index, itemKey) {
    const row = menuItems.find((candidate) => String(candidate.item_key ?? candidate.id) === itemKey) || null;
    setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? { itemKey, raw: row } : slot)));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) {
      readFileAsDataUrl(file).then(setPhotoPreview).catch(() => setPhotoPreview(""));
    } else {
      setPhotoPreview("");
    }
  }

  function resetForNextDish() {
    setSlots(emptySlots());
    setSelectedMenu("");
    setMenuItems([]);
    setDishName("");
    setDishNameTouched(false);
    setActualPortion("");
    setRatings(emptyRatings());
    setNotes(emptyNotes());
    setStrengths("");
    setOpportunities("");
    setPhotoFile(null);
    setPhotoPreview("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess(null);

    if (!cafeName.trim() || !stationName || !dishName.trim() || !taster) {
      setSubmitError("Cafe, Station, Dish, and Taster are required.");
      return;
    }

    const record = {
      Date: date,
      "Cafe Name": cafeName.trim(),
      "Station Name": stationName,
      "Dish Name": dishName.trim(),
      Taster: taster,
      ...ratings,
      ...notes,
      "5. Strengths": strengths,
      "5. Opportunities": opportunities,
    };
    if (targetPortion !== "") record["2.Target_Portion"] = String(targetPortion);
    if (actualPortion !== "") record["2.Actual_Portion"] = String(actualPortion);

    setSubmitting(true);
    try {
      const result = await fetchJson("/api/smartsheet/records?dataset=cafe-tasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addTastingSubmission", record }),
      });

      if (photoFile && result.rowId) {
        const dataUrl = await readFileAsDataUrl(photoFile);
        await fetchJson("/api/smartsheet/records?dataset=cafe-tasting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "uploadTastingPhoto", rowId: result.rowId, fileName: photoFile.name, dataBase64: dataUrl }),
        });
      }

      setSubmitSuccess({ cafe: record["Cafe Name"], dish: record["Dish Name"] });
      resetForNextDish();
    } catch (error) {
      setSubmitError(error.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const referencePhoto = itemPhoto(slots[0]?.raw);

  return (
    <div className="min-h-screen bg-[#f4f8f7] pb-16 text-slate-950">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToPlatform}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Platform Home
          </button>
          <button
            type="button"
            onClick={() => setShowRouting((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Settings2 size={16} /> {showRouting ? "Hide Routing" : "Manage Routing"}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b99b55]">Programming &amp; Auditing</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Cafe Tasting Form</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Build the plate, weigh it, and submit straight to the Cafe Tasting Submission Worksheet.</p>
        </div>

        {showRouting ? <RoutingManager onRoutesChanged={setRoutes} /> : null}

        {schemaError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{schemaError}</div>
        ) : null}
        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{submitError}</div>
        ) : null}
        {submitSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            Submitted {submitSuccess.dish} for {submitSuccess.cafe}. Ready for the next dish.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Tasting Details</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Date">
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} required />
              </Field>
              <Field label="Cafe Name">
                <input
                  list="cafe-name-options"
                  value={cafeName}
                  onChange={(event) => setCafeName(event.target.value)}
                  className={inputClass}
                  placeholder="Start typing a cafe"
                  required
                />
                <datalist id="cafe-name-options">
                  {cafeOptions.map((option) => <option key={option} value={option} />)}
                </datalist>
                {routingPreview ? (
                  routingPreview.found ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      Will notify: {routingPreview.chef || "no chef contact"}{routingPreview.director ? ` · ${routingPreview.director}` : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-amber-600">No routing set up for this cafe yet — no one will be emailed.</p>
                  )
                ) : null}
              </Field>
              <Field label="Station Name">
                <select value={stationName} onChange={(event) => setStationName(event.target.value)} className={inputClass} required>
                  <option value="">Select a station</option>
                  {stationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Taster">
                <select value={taster} onChange={(event) => setTaster(event.target.value)} className={inputClass} required>
                  <option value="">Select a taster</option>
                  {tasterOptions.map((option) => (
                    <option key={option.email} value={option.email}>{option.name || option.email}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Build the Plate</h2>
            <Field label="Menu">
              <select value={selectedMenu} onChange={(event) => { setSelectedMenu(event.target.value); setSlots(emptySlots()); }} className={inputClass}>
                <option value="">Select a menu</option>
                {menus.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
              </select>
            </Field>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {slots.map((slot, index) => (
                <Field key={index} label={index === 0 ? "Entree / Item 1" : `Item ${index + 1}`}>
                  <select
                    value={slot.itemKey}
                    onChange={(event) => updateSlot(index, event.target.value)}
                    className={inputClass}
                    disabled={!selectedMenu || menuItemsLoading}
                  >
                    <option value="">{menuItemsLoading ? "Loading items…" : "None"}</option>
                    {menuItems.map((row) => {
                      const key = String(row.item_key ?? row.id);
                      return <option key={key} value={key}>{itemLabel(row)}</option>;
                    })}
                  </select>
                </Field>
              ))}
            </div>

            {referencePhoto ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img src={referencePhoto.src} alt={referencePhoto.alt} className="h-24 w-24 rounded-xl object-cover" />
                <p className="text-sm font-semibold text-slate-600">Reference photo for {slots[0]?.raw?.display_name}</p>
              </div>
            ) : null}

            {slots[0]?.raw?.description ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-amber-700">Item Description</p>
                <p className="mt-1 text-sm font-medium text-amber-900">{slots[0].raw.description}</p>
                <p className="mt-1 text-xs font-semibold text-amber-700">If this description mentions a choice (side, sauce, etc.), use the extra item slots below to record what was actually plated.</p>
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Target Weight (auto)">
                <input type="text" value={targetPortion === "" ? "" : `${targetPortion} oz`} readOnly className={`${inputClass} bg-slate-100`} />
              </Field>
              <Field label="Actual Weight (weigh &amp; enter, number only)">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={actualPortion}
                  onChange={(event) => setActualPortion(event.target.value)}
                  className={inputClass}
                  placeholder="e.g. 15.1"
                />
              </Field>
              <Field label="Dish Name">
                <input
                  type="text"
                  value={dishName}
                  onChange={(event) => { setDishNameTouched(true); setDishName(event.target.value); }}
                  className={inputClass}
                  placeholder="Auto-fills from selected items"
                  required
                />
                {dishNameTouched && autoDishName && autoDishName !== dishName ? (
                  <button
                    type="button"
                    onClick={() => { setDishNameTouched(false); setDishName(autoDishName); }}
                    className="mt-1 w-fit text-xs font-black uppercase tracking-wide text-emerald-700 hover:text-emerald-800"
                  >
                    Reset to "{autoDishName}"
                  </button>
                ) : null}
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Presentation &amp; Ratings</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {RATING_FIELDS.map((field) => (
                <RatingSelect key={field} field={field} value={ratings[field]} options={ratingOptionsFor(field, optionsFor)} onChange={(value) => setRatings((current) => ({ ...current, [field]: value }))} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {NOTE_FIELDS.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <textarea value={notes[key]} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} min-h-[70px]`} />
                </Field>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Summary &amp; Photo</h2>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <Field label="Strengths">
                <textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} className={`${inputClass} min-h-[70px]`} />
              </Field>
              <Field label="Opportunities">
                <textarea value={opportunities} onChange={(event) => setOpportunities(event.target.value)} className={`${inputClass} min-h-[70px]`} />
              </Field>
              <Field label="Photo (optional, 1 max)">
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  <Camera size={18} />
                  {photoFile ? photoFile.name : "Take or choose a photo"}
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                </label>
                {photoPreview ? <img src={photoPreview} alt="Selected preview" className="mt-2 h-32 w-32 rounded-xl object-cover" /> : null}
              </Field>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {submitting ? "Submitting…" : "Submit Tasting"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ratingOptionsFor(field, optionsFor) {
  const liveOptions = optionsFor(field);
  if (liveOptions.length) return liveOptions;
  if (TWO_OPTION_FIELDS.includes(field)) return ["Met Standard", "Needs Adjustment"];
  if (PORTION_OPTION_FIELDS.includes(field)) return ["Below", "Meets", "Above Standard"];
  if (FIVE_OPTION_FIELDS.includes(field)) return ["5 (Great)", "4", "3", "2", "1 (Poor)"];
  if (ALIGNED_OPTION_FIELDS.includes(field)) return ["Aligned", "Adjusted"];
  return [];
}

function RatingSelect({ field, value, options, onChange }) {
  return (
    <Field label={field.replace(/^\d\.\s*/, "")}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">Not rated</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";

function RoutingManager({ onRoutesChanged }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cafe, setCafe] = useState("");
  const [chefEmails, setChefEmails] = useState([""]);
  const [directorEmails, setDirectorEmails] = useState([""]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  function loadRoutes() {
    setLoading(true);
    fetchJson("/api/smartsheet/records?dataset=cafe-tasting-routing")
      .then((payload) => {
        const records = payload.records || [];
        setRoutes(records);
        onRoutesChanged?.(records);
      })
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadRoutes, []);

  async function handleAddRoute(event) {
    event.preventDefault();
    setSaveError("");
    setSaveSuccess("");
    if (!cafe.trim()) {
      setSaveError("Cafe is required.");
      return;
    }
    setSaving(true);
    try {
      await fetchJson("/api/smartsheet/records?dataset=cafe-tasting-routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addRoutingRoute",
          cafe: cafe.trim(),
          chefContact: chefEmails.map((email) => email.trim()).filter(Boolean),
          directorContact: directorEmails.map((email) => email.trim()).filter(Boolean),
        }),
      });
      setSaveSuccess(`Added routing for ${cafe.trim()}.`);
      setCafe("");
      setChefEmails([""]);
      setDirectorEmails([""]);
      loadRoutes();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function updateEmailList(list, setList, index, value) {
    setList(list.map((entry, entryIndex) => (entryIndex === index ? value : entry)));
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Routing Table</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">Controls who gets the Chef/Director email alert for each cafe.</p>

      {saveError ? <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{saveError}</div> : null}
      {saveSuccess ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{saveSuccess}</div> : null}

      <form onSubmit={handleAddRoute} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Cafe">
          <input type="text" value={cafe} onChange={(event) => setCafe(event.target.value)} className={inputClass} placeholder="New cafe name" />
        </Field>
        <div />
        <EmailListField label="Chef Contact email(s)" emails={chefEmails} setEmails={setChefEmails} updateEmailList={updateEmailList} />
        <EmailListField label="Director Contact email(s)" emails={directorEmails} setEmails={setDirectorEmails} updateEmailList={updateEmailList} />
        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add Cafe to Routing Table"}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4">
        {loading ? <p className="text-sm font-semibold text-slate-500">Loading routing table…</p> : null}
        {loadError ? <p className="text-sm font-semibold text-rose-600">{loadError}</p> : null}
        {!loading && !loadError ? (
          <ul className="flex flex-col gap-2">
            {routes.map((route) => (
              <li key={route.__smartsheetRowId} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-bold text-slate-800">{route.Cafe}</span>
                <span className="text-slate-500"> — Chef: {route["Chef Contact"] || "none"} · Director: {route["Director Contact"] || "none"}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function EmailListField({ label, emails, setEmails, updateEmailList }) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:col-span-1">
      <span className="font-bold text-slate-700">{label}</span>
      {emails.map((email, index) => (
        <input
          key={index}
          type="email"
          value={email}
          onChange={(event) => updateEmailList(emails, setEmails, index, event.target.value)}
          className={inputClass}
          placeholder="name@compass-usa.com"
        />
      ))}
      <button
        type="button"
        onClick={() => setEmails([...emails, ""])}
        className="w-fit text-xs font-black uppercase tracking-wide text-emerald-700 hover:text-emerald-800"
      >
        + Add another email
      </button>
    </div>
  );
}
