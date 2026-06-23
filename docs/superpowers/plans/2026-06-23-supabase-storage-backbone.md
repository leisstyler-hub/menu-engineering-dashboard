# Supabase Storage Backbone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store Neighborhood Rotation selections and Lean Tool results in Supabase first, while keeping Smartsheet as the automatic mirror/fallback and retaining operational data for two years.

**Architecture:** Add a small storage backbone layer between the app tools and the existing Smartsheet client. The browser calls a Vercel API for Supabase reads/writes so database service credentials never reach the browser; the same saved records continue to sync to Smartsheet as a fallback and readable mirror.

**Tech Stack:** React, Vite, Vercel Serverless Functions, Supabase REST API, existing Smartsheet API route, Node verification scripts.

---

### Task 1: Shared Storage Translator

**Files:**
- Create: `src/integrations/storage/backboneRecords.js`
- Create: `scripts/test-storage-backbone.mjs`

- [ ] Write tests that prove flat app records are converted to Supabase rows with stable ids, tool scope, searchable columns, JSON payloads, and a two-year retention timestamp.
- [ ] Implement the translator and parser.
- [ ] Run the storage test.

### Task 2: Supabase Server API

**Files:**
- Create: `api/storage/records.js`
- Modify: `supabase/lean-results-schema.sql`

- [ ] Add an app record table for both tools, with indexed operational columns and the full record payload.
- [ ] Add retention columns and a cleanup function that purges rows after two years.
- [ ] Add a Vercel API that reads and upserts records through the Supabase service role key only on the server.
- [ ] Treat missing Supabase server configuration as a clean skip so Smartsheet can continue to work.

### Task 3: Browser Storage Client

**Files:**
- Create: `src/integrations/storage/backboneClient.js`
- Modify: `src/features/lean-tool/LeanTool.jsx`
- Modify: `src/features/neighborhood-rotations/NeighborhoodRotations.jsx`

- [ ] Save to Supabase first.
- [ ] Mirror to Smartsheet after Supabase saves.
- [ ] If Supabase is unavailable or not yet configured, save to Smartsheet and report fallback status.
- [ ] Load from Supabase first, but fall back to Smartsheet when Supabase is empty or unavailable during the transition.

### Task 4: Health, Version, Verification

**Files:**
- Modify: `src/features/smartsheet-health/SmartsheetHealth.jsx`
- Modify: `src/shared/appConfig.js`
- Modify: `CHANGELOG.md`

- [ ] Show Supabase as primary storage and Smartsheet as fallback/mirror.
- [ ] Update the visible version stamp.
- [ ] Run the storage test and full app verification.
- [ ] Deploy production and confirm the live app opens.
