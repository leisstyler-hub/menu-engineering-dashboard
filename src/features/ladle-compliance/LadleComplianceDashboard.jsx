import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";

export default function LadleComplianceDashboard({ onBackToPlatform }) {
  const seededRows = [
    { district: "South", unit: "Doppler", week: "Current Week", compliance: 96, completed: 144, expected: 150, missed: 6, trend: 4 },
    { district: "South", unit: "Day 1", week: "Current Week", compliance: 91, completed: 137, expected: 150, missed: 13, trend: 2 },
    { district: "South", unit: "Nitro", week: "Current Week", compliance: 84, completed: 126, expected: 150, missed: 24, trend: -3 },
    { district: "South", unit: "Re:Invent", week: "Current Week", compliance: 78, completed: 117, expected: 150, missed: 33, trend: -6 },
    { district: "North", unit: "Cricket", week: "Current Week", compliance: 93, completed: 140, expected: 150, missed: 10, trend: 1 },
    { district: "North", unit: "Moby", week: "Current Week", compliance: 88, completed: 132, expected: 150, missed: 18, trend: -1 },
    { district: "North", unit: "Dawson", week: "Current Week", compliance: 90, completed: 135, expected: 150, missed: 15, trend: 3 },
    { district: "North", unit: "Nessie", week: "Current Week", compliance: 82, completed: 123, expected: 150, missed: 27, trend: -4 },
    { district: "East", unit: "East Café 1", week: "Current Week", compliance: 89, completed: 134, expected: 150, missed: 16, trend: 2 },
    { district: "LAX", unit: "LAX22", week: "Current Week", compliance: 87, completed: 131, expected: 150, missed: 19, trend: -2 },
  ];

  const [rows, setRows] = useState(seededRows);
  const [district, setDistrict] = useState("South");
  const [week, setWeek] = useState("Current Week");
  const [unit, setUnit] = useState("All Units");
  const [viewMode, setViewMode] = useState("executive");
  const [uploadedFileName, setUploadedFileName] = useState("");

  const districtOptions = useMemo(() => ["All", ...Array.from(new Set(rows.map((row) => row.district).filter(Boolean))).sort()], [rows]);
  const weekOptions = useMemo(() => ["Current Week", "Previous Week", "Rolling 4 Weeks", ...Array.from(new Set(rows.map((row) => row.week).filter(Boolean))).filter((wk) => !["Current Week", "Previous Week", "Rolling 4 Weeks"].includes(wk)).sort()], [rows]);
  const unitOptions = useMemo(() => ["All Units", ...Array.from(new Set(rows.filter((row) => district === "All" || row.district === district).map((row) => row.unit).filter(Boolean))).sort()], [rows, district]);

  useEffect(() => {
    if (!unitOptions.includes(unit)) setUnit("All Units");
  }, [unitOptions, unit]);

  const filtered = useMemo(() => rows.filter((row) => {
    const districtMatch = district === "All" || row.district === district;
    const unitMatch = unit === "All Units" || row.unit === unit;
    const weekMatch = week === "Rolling 4 Weeks" || week === "Current Week" || row.week === week;
    return districtMatch && unitMatch && weekMatch;
  }), [rows, district, unit, week]);

  const summary = useMemo(() => {
    const totalExpected = filtered.reduce((sum, row) => sum + Number(row.expected || 0), 0);
    const totalCompleted = filtered.reduce((sum, row) => sum + Number(row.completed || 0), 0);
    const totalMissed = filtered.reduce((sum, row) => sum + Number(row.missed || 0), 0);
    const averageCompliance = totalExpected ? Math.round((totalCompleted / totalExpected) * 100) : filtered.length ? Math.round(filtered.reduce((sum, row) => sum + Number(row.compliance || 0), 0) / filtered.length) : 0;
    const compliantUnits = filtered.filter((row) => Number(row.compliance || 0) >= 90).length;
    const watchUnits = filtered.filter((row) => Number(row.compliance || 0) >= 85 && Number(row.compliance || 0) < 90).length;
    const atRiskUnits = filtered.filter((row) => Number(row.compliance || 0) < 85).length;
    const focusUnit = [...filtered].sort((a, b) => Number(a.compliance || 0) - Number(b.compliance || 0))[0];
    return { totalExpected, totalCompleted, totalMissed, averageCompliance, compliantUnits, watchUnits, atRiskUnits, focusUnit };
  }, [filtered]);

  const parseUploadedLadleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const parsedRows = rawRows.map((row, index) => {
      const unitName = row.Unit || row.Cafe || row.Café || row.Location || row["Unit Name"] || row["Cafe Name"] || row["Café Name"] || `Unit ${index + 1}`;
      const expected = Number(row.Expected || row["Expected Checks"] || row.Total || row["Total Checks"] || 0);
      const completed = Number(row.Completed || row["Completed Checks"] || row.Complete || 0);
      const missedRaw = row.Missed || row["Missed Checks"] || row.Incomplete || null;
      const complianceRaw = row.Compliance || row["Compliance %"] || row.Score || row["Score %"] || null;
      const compliance = complianceRaw != null
        ? Number(String(complianceRaw).replace("%", "")) > 1
          ? Number(String(complianceRaw).replace("%", ""))
          : Number(String(complianceRaw).replace("%", "")) * 100
        : expected
          ? (completed / expected) * 100
          : 0;
      const missed = missedRaw != null ? Number(missedRaw) : Math.max(0, expected - completed);

      return {
        district: row.District || district || "South",
        unit: unitName,
        week: row.Week || row.Period || row.Date || "Uploaded Week",
        compliance: Math.round(compliance),
        completed,
        expected,
        missed,
        trend: Number(row.Trend || row["Trend %"] || 0)
      };
    }).filter((row) => row.unit);

    if (parsedRows.length) {
      setRows(parsedRows);
      setUploadedFileName(file.name);
      setDistrict("All");
      setWeek("Uploaded Week");
      setUnit("All Units");
    }

    event.target.value = "";
  };

  const complianceTone = (value) => {
    if (Number(value) >= 90) return "bg-emerald-50 border-emerald-200 text-emerald-900";
    if (Number(value) >= 85) return "bg-amber-50 border-amber-200 text-amber-900";
    return "bg-rose-50 border-rose-200 text-rose-900";
  };

  const complianceLabel = (value) => {
    if (Number(value) >= 90) return "Strong";
    if (Number(value) >= 85) return "Watch";
    return "Follow Up";
  };

  const barTone = (value) => {
    if (Number(value) >= 90) return "bg-emerald-500";
    if (Number(value) >= 85) return "bg-amber-500";
    return "bg-rose-500";
  };

  const sortedRows = [...filtered].sort((a, b) => Number(a.compliance || 0) - Number(b.compliance || 0));
  const trendBars = [82, 85, 88, 91, summary.averageCompliance];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-[2rem] bg-white border border-slate-200 p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              onClick={onBackToPlatform}
              className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              ← Back to Culinary Tools Platform
            </button>
            <CompassOneLogo compact />
          </div>

          <div className="mt-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-sky-700 font-bold">Test Concept / Can Delete</p>
              <h1 className="text-4xl md:text-5xl font-bold mt-2">Ladle Compliance Dashboard</h1>
              <p className="mt-3 text-slate-600 max-w-3xl">
                Review Ladle compliance by district, café, and week. This prototype is isolated from Menu Engineering and Neighborhood Rotations.
              </p>
            </div>

            <div className="rounded-3xl bg-sky-50 border border-sky-200 p-4 min-w-[320px]">
              <label className="block text-sm font-semibold text-sky-900 mb-2">Upload Ladle spreadsheet</label>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={parseUploadedLadleFile} className="block w-full text-sm text-sky-900 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700" />
              <p className="text-xs text-sky-800 mt-2">{uploadedFileName ? `Loaded ${uploadedFileName}` : "Uses sample data until a spreadsheet is uploaded."}</p>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border-4 border-red-500 bg-red-50 p-6 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-red-700">Important Data Notice</p>
          <h2 className="mt-2 text-3xl font-black text-red-950">This Ladle dashboard data is not factual.</h2>
          <p className="mt-3 max-w-4xl text-lg font-bold leading-7 text-red-900">
            All Ladle Compliance numbers, trends, unit scores, missed checks, heat maps, and follow-up callouts shown here are placeholder concept data only. Do not use this screen for actual performance reporting, accountability, or operational decisions until a verified Ladle data source is connected.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LadleControl label="District" value={district} setValue={setDistrict} options={districtOptions} />
          <LadleControl label="Week / Period" value={week} setValue={setWeek} options={weekOptions} />
          <LadleControl label="Unit" value={unit} setValue={setUnit} options={unitOptions} />
          <LadleControl label="View" value={viewMode} setValue={setViewMode} options={["executive", "team"]} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LadleMetric title="Overall Compliance" value={`${summary.averageCompliance}%`} sub="completed checks / expected checks" tone={summary.averageCompliance >= 90 ? "green" : summary.averageCompliance >= 85 ? "amber" : "red"} />
          <LadleMetric title="Compliant Units" value={`${summary.compliantUnits}/${filtered.length}`} sub="90% or higher" tone="green" />
          <LadleMetric title="At Risk Units" value={summary.atRiskUnits} sub="below 85%" tone={summary.atRiskUnits ? "red" : "green"} />
          <LadleMetric title="Missed Checks" value={summary.totalMissed} sub="selected scope" tone={summary.totalMissed > 20 ? "amber" : "neutral"} />
        </section>

        {viewMode === "executive" ? (
          <>
            <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Executive Heat Map</p>
                  <h2 className="text-3xl font-bold mt-1">Compliance by Unit</h2>
                  <p className="text-sm text-slate-500 mt-1">Green = strong, amber = watch, red = needs follow-up.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
                  Focus Unit: <span className="font-bold text-slate-900">{summary.focusUnit?.unit || "—"}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {sortedRows.map((row) => (
                  <div key={`${row.district}-${row.unit}`} className={`rounded-3xl border p-5 ${complianceTone(row.compliance)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] opacity-70">{row.district}</p>
                        <h3 className="text-2xl font-bold mt-1">{row.unit}</h3>
                      </div>
                      <span className="rounded-full bg-white/80 border border-white px-3 py-1 text-xs font-bold">{complianceLabel(row.compliance)}</span>
                    </div>
                    <p className="text-5xl font-bold mt-5">{row.compliance}%</p>
                    <p className="text-sm mt-2 opacity-80">{row.missed} missed checks • {row.trend >= 0 ? "+" : ""}{row.trend}% vs prior</p>
                    <div className="mt-4 h-3 rounded-full bg-white/70 overflow-hidden">
                      <div className={`h-full rounded-full ${barTone(row.compliance)}`} style={{ width: `${Math.max(0, Math.min(100, row.compliance))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Trend Concept</p>
                <h2 className="text-3xl font-bold mt-1">Rolling Compliance</h2>
                <p className="text-sm text-slate-500 mt-1">Mock trend until weekly historical data is connected.</p>
                <div className="mt-6 flex items-end gap-3 h-44">
                  {trendBars.map((value, index) => (
                    <div key={index} className="flex-1">
                      <div className={`rounded-t-2xl ${barTone(value)}`} style={{ height: `${Math.max(24, value * 1.45)}px` }} />
                      <p className="text-xs text-center mt-2 text-slate-500">W{index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Leadership Read</p>
                <h2 className="text-3xl font-bold mt-1">Follow-Up Callouts</h2>
                <div className="mt-5 space-y-3">
                  {sortedRows.filter((row) => row.compliance < 90).slice(0, 5).map((row) => (
                    <div key={row.unit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">{row.unit}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${complianceTone(row.compliance)}`}>{row.compliance}%</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Review missed checks, closeout habits, and manager follow-up rhythm.</p>
                    </div>
                  ))}
                  {!sortedRows.some((row) => row.compliance < 90) && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                      <p className="font-bold">No major follow-up flags</p>
                      <p className="text-sm mt-1">All selected units are at or above 90% compliance.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Team View</p>
            <h2 className="text-3xl font-bold mt-1">Unit Detail</h2>
            <div className="mt-5 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-500">
                  <tr className="text-left">
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Compliance</th>
                    <th className="px-4 py-3">Completed</th>
                    <th className="px-4 py-3">Expected</th>
                    <th className="px-4 py-3">Missed</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedRows.map((row) => (
                    <tr key={`${row.district}-${row.unit}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.district}</td>
                      <td className="px-4 py-3 font-semibold">{row.unit}</td>
                      <td className="px-4 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${complianceTone(row.compliance)}`}>{row.compliance}%</span></td>
                      <td className="px-4 py-3">{row.completed}</td>
                      <td className="px-4 py-3">{row.expected}</td>
                      <td className="px-4 py-3">{row.missed}</td>
                      <td className="px-4 py-3 text-slate-600">{row.compliance >= 90 ? "Maintain rhythm." : row.compliance >= 85 ? "Review weak dayparts." : "Manager follow-up needed."}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function LadleControl({ label, value, setValue, options }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <label className="block text-sm font-semibold text-slate-500 mb-2">{label}</label>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function LadleMetric({ title, value, sub, tone = "neutral" }) {
  const toneClass = tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "red" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-900";
  return (
    <div className={`rounded-3xl border p-5 shadow-xl ${toneClass}`}>
      <p className="text-sm font-semibold opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-70 mt-2">{sub}</p>
    </div>
  );
}
