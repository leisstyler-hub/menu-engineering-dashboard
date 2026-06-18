import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip/dist/jszip.min.js";

const TEMPLATE_PATH = path.join(process.cwd(), "api", "bingo", "templates", "bingo-grill-template.pptx");

function xmlEscape(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripDietSuffix(title = "") {
  return String(title || "").replace(/\s+(VN|V|VEGAN|VEGETARIAN)$/i, "").trim();
}

function titleWithDiet(title = "", diet = "") {
  const base = stripDietSuffix(title).toUpperCase();
  const tag = /^vegan$/i.test(diet) ? "VN" : /^vegetarian$/i.test(diet) ? "V" : "";
  return { base, tag };
}

function splitFreshTitle(title = "") {
  const words = String(title || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [words.join(" "), ""];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

function splitGrillDescription(description = "") {
  const text = String(description || "").trim();
  const comma = text.indexOf(",");
  if (comma > 12 && comma < 45) {
    return [text.slice(0, comma + 1), ` ${text.slice(comma + 1).trim()}`];
  }
  return [text.slice(0, 36), text.slice(36) ? ` ${text.slice(36).trim()}` : ""];
}

function caloriesNumber(calories = "") {
  const value = String(calories || "").match(/\d+/)?.[0] || "";
  return value;
}

function priceText(value, fallback) {
  const number = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number.toFixed(2) : fallback;
}

function replaceOnce(text, from, to) {
  const index = text.indexOf(from);
  if (index < 0) throw new Error(`Template text not found: ${from}`);
  return `${text.slice(0, index)}${to}${text.slice(index + from.length)}`;
}

function stripHighlightsBetween(xml, startNeedle, endNeedle) {
  const textStart = xml.indexOf(startNeedle);
  if (textStart < 0) throw new Error(`Template highlight start not found: ${startNeedle}`);
  const start = Math.max(xml.lastIndexOf("<a:tc", textStart), 0);
  const end = xml.indexOf(endNeedle, textStart);
  if (end < 0) throw new Error(`Template highlight end not found: ${endNeedle}`);
  const before = xml.slice(0, start);
  const window = xml.slice(start, end);
  const after = xml.slice(end);
  return `${before}${window.replace(/<a:highlight>[\s\S]*?<\/a:highlight>/g, "")}${after}`;
}

function replaceTextBetween(xml, startNeedle, endNeedle, replacements) {
  const textStart = xml.indexOf(startNeedle);
  if (textStart < 0) throw new Error(`Template edit start not found: ${startNeedle}`);
  const start = Math.max(xml.lastIndexOf("<a:tc", textStart), 0);
  const end = xml.indexOf(endNeedle, textStart);
  if (end < 0) throw new Error(`Template edit end not found: ${endNeedle}`);
  let window = xml.slice(start, end);
  for (const [from, to] of replacements) {
    window = replaceOnce(window, `<a:t>${from}</a:t>`, `<a:t>${xmlEscape(to)}</a:t>`);
  }
  return `${xml.slice(0, start)}${window}${xml.slice(end)}`;
}

function buildSlideXml(xml, grill, freshFive) {
  const grillTitle = titleWithDiet(grill.title || "Location Spotlight", grill.diet);
  const freshTitle = titleWithDiet(freshFive.title || "Fresh Five", freshFive.diet);
  const [freshLine1, freshLine2] = splitFreshTitle(freshTitle.base);
  const [grillDesc1, grillDesc2] = splitGrillDescription(grill.description || "");

  let nextXml = stripHighlightsBetween(xml, "BBQ BEEF AND MUSHROOM BURGER", "GRILLED CHICKEN SANDWICH");
  nextXml = stripHighlightsBetween(nextXml, "SPICY TURMERIC ", "GARDEN SALAD ");

  nextXml = replaceTextBetween(nextXml, "BBQ BEEF AND MUSHROOM BURGER", "GRILLED CHICKEN SANDWICH", [
    ["BBQ BEEF AND MUSHROOM BURGER", grillTitle.tag ? `${grillTitle.base} ${grillTitle.tag}` : grillTitle.base],
    ["blended beef and mushroom burger,", grillDesc1],
    [" with bourbon barbecue sauce, candied bacon and cheddar cheese ", grillDesc2],
    ["975 ", `${caloriesNumber(grill.calories) || "0"} `],
    ["11.75", priceText(grill.price, "11.75")]
  ]);

  nextXml = replaceTextBetween(nextXml, "SPICY TURMERIC ", "GARDEN SALAD ", [
    ["SPICY TURMERIC ", freshLine1 ? `${freshLine1} ` : ""],
    ["TOFU WRAP ", freshLine2 ? `${freshLine2} ` : ""],
    ["VN", freshTitle.tag],
    ["curried tofu, spicy turmeric hummus, spinach, cucumber, tomato and onion in a tortilla, served a la carte", freshFive.description || ""],
    ["400 ", `${caloriesNumber(freshFive.calories) || "0"} `],
    ["5.00", priceText(freshFive.price, "5.00")]
  ]);

  return nextXml;
}

function validateItem(item, label) {
  const missing = [];
  if (!String(item?.title || "").trim()) missing.push("title");
  if (!caloriesNumber(item?.calories)) missing.push("calories");
  if (!String(item?.description || "").trim()) missing.push("description");
  if (missing.length) {
    const error = new Error(`${label} is missing ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Use POST to generate a Bingo menu." });
  }

  try {
    const { week = "", grill = {}, freshFive = {} } = req.body || {};
    validateItem(grill, "Grill Location Spotlight");
    validateItem(freshFive, "Grill Fresh Five");

    const source = await fs.readFile(TEMPLATE_PATH);
    const zip = await JSZip.loadAsync(source);
    const slidePath = "ppt/slides/slide3.xml";
    const slideFile = zip.file(slidePath);
    if (!slideFile) throw new Error("Bingo template is missing slide 3.");

    const slideXml = await slideFile.async("string");
    zip.file(slidePath, buildSlideXml(slideXml, grill, freshFive));

    const output = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    const safeWeek = String(week || "week").replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename="bingo-grill-menu-${safeWeek || "week"}.pptx"`);
    return res.status(200).send(output);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Bingo menu generation failed"
    });
  }
}
