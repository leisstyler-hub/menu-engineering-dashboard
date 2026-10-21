import { test, expect } from "@playwright/test";

for (const type of ["Core", "Promotion"]) {
  test(`SSMT ${type} layout keeps setup readable and table bounded`, async ({ page }, testInfo) => {
    const writes = [];
    const menu = { id: "layout-menu", name: `Layout ${type}`, type, phase: "Culinary draft", fixyDesignation: "LAYOUT", activeStart: "2026-11-01", activeEnd: "2026-11-30", promotionSchedule: {mode:"weekly",weekdays:[4],skippedDates:["2026-11-26"]}, items: Array.from({length:18}, (_,i)=>({id:`layout-${i}`,name:`Layout item ${i + 1}`,label:`Layout item ${i + 1}`,mrn:`000${i}.10`,modifierGroups:[],seaPrice:"$5.00"})) };
    await page.addInitScript(() => {localStorage.clear();sessionStorage.clear();});
    await page.route("**/api/ssmt**", r => r.fulfill({json:{ok:true,enabled:false,menus:[]}}));
    await page.route("**/api/smartsheet/records**", r => r.fulfill({json:{ok:true,records:[]}}));
    await page.route("**/api/storage/records**", r => {
      if(r.request().method()!=="GET") writes.push(r.request().postDataJSON());
      return r.fulfill({json:{ok:true,source:"supabase",records:[{"Record ID":"ssmt|workspace|current",menus:[menu],menuTypes:["Core","Global","Promotion","Thompson Hospitality"],priceBook:[],modifierGroups:[],selectedMenuId:menu.id,seedMenuTypeCorrectionsApplied:true}]}});
    });
    await page.setViewportSize({width:1440,height:1000});
    await page.goto("/");
    await page.getByRole("button",{name:/open ssmt/i}).click();
    await page.getByLabel(/SSMT passcode/i).fill("0411");
    await page.getByRole("button",{name:/unlock ssmt/i}).click();
    await expect(page.getByRole("navigation",{name:"SSMT sections"})).toHaveCount(0);
    const pricing=page.getByRole("button",{name:"Pricing Structure",exact:true});
    await expect(pricing).toHaveCount(1);
    await expect(pricing).toHaveCSS("background-color","rgb(4, 120, 87)");
    await page.screenshot({path:testInfo.outputPath(`landing-${type}.png`),fullPage:true});
    await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();
    await page.locator('button[data-menu-name]').filter({hasText:menu.name}).click();
    const fixy=page.getByTestId("ssmt-fixy-setup");
    await expect(fixy.getByLabel("Menu FIXY designation",{exact:true})).toBeVisible();
    await expect(fixy.getByRole("button",{name:"Generate FIXY",exact:true})).toBeVisible();
    const field=await fixy.getByLabel("Menu FIXY designation",{exact:true}).boundingBox();
    const generate=await fixy.getByRole("button",{name:"Generate FIXY",exact:true}).boundingBox();
    expect(Math.abs(field.y-generate.y)).toBeLessThan(5);
    await expect(page.getByTestId("ssmt-phase-panel").getByText("Edit signal",{exact:true})).toBeVisible();
    await expect(page.getByTestId("ssmt-menu-schedule")).toHaveCount(type==="Promotion"?1:0);
    if(type==="Promotion") {
      await expect(page.getByLabel("Skip promotion date")).not.toBeVisible();
      await page.getByText("Skipped dates (1)",{exact:true}).click();
      await expect(page.getByLabel("Skip promotion date")).toBeVisible();
      await page.getByText("Skipped dates (1)",{exact:true}).click();
    }
    const geometry=await page.getByTestId("ssmt-builder-scroll").evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,tableWidth:el.querySelector("table").getBoundingClientRect().width,top:el.getBoundingClientRect().top,visibleRows:[...el.querySelectorAll("tbody tr")].filter(row=>row.getBoundingClientRect().top<innerHeight&&row.getBoundingClientRect().bottom>0).length}));
    expect(geometry.tableWidth).toBe(2680);
    expect(geometry.width).toBeLessThanOrEqual(1440);
    console.log(`${type} 1440x1000: ${JSON.stringify(geometry)}`);
    await testInfo.attach("layout-geometry",{body:JSON.stringify(geometry),contentType:"application/json"});
    await page.screenshot({path:testInfo.outputPath(`editor-${type}.png`),fullPage:true});
    await page.setViewportSize({width:2800,height:1000});
    const wideGeometry=await page.getByTestId("ssmt-builder-scroll").evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,tableWidth:el.querySelector("table").getBoundingClientRect().width,top:el.getBoundingClientRect().top,visibleRows:[...el.querySelectorAll("tbody tr")].filter(row=>row.getBoundingClientRect().top<innerHeight&&row.getBoundingClientRect().bottom>0).length}));
    console.log(`${type} 2800x1000: ${JSON.stringify(wideGeometry)}`);
    expect(wideGeometry.visibleRows).toBeGreaterThan(0);
    await page.screenshot({path:testInfo.outputPath(`wide-${type}.png`)});
    await page.setViewportSize({width:390,height:844});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await fixy.scrollIntoViewIfNeeded();
    await page.screenshot({path:testInfo.outputPath(`phone-${type}.png`)});
    expect(writes).toEqual([]);
  });
}
