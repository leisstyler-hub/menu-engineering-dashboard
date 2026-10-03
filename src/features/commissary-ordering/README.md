# Commissary Ordering Tool handoff

The Draft Commissary Ordering Tool stores one shared Supabase order per receiving cafe and service week. Initial receiving cafes are Nessie and Cricket. Commissary (`SEA20 Cricket`, profit center `22472`) is the fixed departing unit.

- Monday delivery covers Monday–Wednesday service; Wednesday delivery covers Thursday–Friday service.
- The server and browser lock a service week at 5:00 PM `America/Los_Angeles` on the prior Wednesday.
- Most items order by quart. Dressings retain the workbook's stated container unit: gallon by default, 5-liter container for Balsamic Vinegar, and 32-ounce bottle for Fat Free Italian.
- Item `Requires ...` and `New recipe` notes remain internal catalog/BOM production guidance and are not rendered in the chef-facing ordering grid.
- `Generate transfer` sits below `Save shared order` and exports the current on-screen quantities, including unsaved edits, without writing an order record.
- `Generate consolidated BOM` is available with the active order and combines the current on-screen cafe quantities with other saved cafe orders for that week. Its workbook has a consolidated prep-list tab plus separate Monday and Wednesday cafe-delivery-map tabs.
- Locked weeks retain the combined BOM and one exact-template S4 transfer workbook per cafe.
- S4 exports consolidate both deliveries to one row per item, cover the Friday–Thursday accounting period, use the receiving cafe profit center, and apply the approved Prepared Foods G/L fallback (`4111011`).
- Aleppo-Edamame uses MRN `176736` per the requesting admin.
