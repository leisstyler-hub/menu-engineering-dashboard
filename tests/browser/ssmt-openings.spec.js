import {test,expect} from "@playwright/test";
import {validateOpeningChange} from "../../src/features/ssmt/ssmtOpening.js";
import {validateExperienceChange} from "../../src/features/ssmt/ssmtAudit.js";
const oldItem={id:"old",name:"Burger",label:"BURGER",description:"Beef burger",mrn:"00042.10",fohColumn:"R FBB | GRILL | BURGER ENT BF",calories:"540",lockedForCentric:false,modifierGroups:[],reviewBasis:{source:"baseline",mrn:"00042.10",description:"Beef burger"}};
async function isolated(page,{role="Chef",admin=true}={}) {
 let shared={menus:[{id:"opening",name:"Test Opening",type:"New Unit Openings",phase:"Culinary draft",stations:[{id:"grill",name:"Grill",fixyDesignation:"UNIT GRILL",globalMenus:[]}],owners:[{id:"one",email:"chef@example.test",name:"Test Chef"}],items:[{...oldItem,stationId:"grill"},{...oldItem,id:"lto",label:"LTO",mrn:"00042.11",stationId:"grill",weeks:[2],reviewBasis:{source:"new"}}]},{id:"core",name:"Grill Core",type:"Core",phase:"IT complete",items:[oldItem]},{id:"global",name:"Global One",type:"Global",phase:"IT complete",items:[{...oldItem,id:"global-item"}]}],modifierGroups:[],priceBook:[],priceBookArchives:[],deletedMenuKeys:[],seedMenuTypeCorrectionsApplied:true,selectedMenuId:"opening"};
 if(role==="Experience"){shared.menus[0].phase="Experience review";shared.menus[0].items.forEach(i=>i.lockedForCentric=true);}
 const saves=[];const member={id:"one",name:"Test Chef",email:"chef@example.test",role,isAdmin:admin};
 const members=[{user_id:"one",display_name:"Test Chef",email:member.email,active:true},{user_id:"two",display_name:"Second Owner",email:"second@example.test",active:true}];
 await page.route("**/api/storage/records**",r=>r.fulfill({json:{ok:true,records:[]}}));
 await page.route("**/api/smartsheet/records**",r=>r.fulfill({json:{ok:true,records:[]}}));
 await page.route("**/api/ssmt**",async r=>{
 const body=r.request().method()==="POST"?r.request().postDataJSON():null;
 const action=body?.action||new URL(r.request().url()).searchParams.get("action");
 if(action==="status")return r.fulfill({json:{ok:true,enabled:true}});
 if(action==="session")return r.fulfill({json:{ok:true,member}});
 if(action==="calendar")return r.fulfill({json:{ok:true,menus:[]}});
 if(action==="members")return r.fulfill({json:{ok:true,members}});
 if(action==="workspace")return r.fulfill({json:{ok:true,workspace:shared,revision:"r"}});
 if(action==="save") {const error=validateOpeningChange(shared,body.workspace,{user_id:"one",work_role:role,is_admin:admin},members)||(role==="Experience"?validateExperienceChange(shared,body.workspace):"");if(error)return r.fulfill({status:403,json:{ok:false,message:error}});shared=body.workspace;saves.push(structuredClone(shared));return r.fulfill({json:{ok:true,revision:"r"}});}
 return r.fulfill({status:400,json:{ok:false,message:`Unexpected fixture action ${action}`}});
 });
 await page.goto("/");await page.getByRole("button",{name:/open ssmt/i}).click();
 return {saves,get:()=>shared};
}
test("station/week builder and clean review preserve all underlying data",async({page})=>{
 const state=await isolated(page);
 await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();
 await expect(page.getByRole("region",{name:"My menu assignments"})).toBeVisible();
 await page.locator('[data-menu-name="Test Opening"]').click();
 await page.getByLabel("Opening station",{exact:true}).selectOption("grill");
 await page.getByLabel("Rotation week",{exact:true}).selectOption("1");
 await expect(page.getByLabel("Item label",{exact:true})).toHaveCount(1);
 await page.getByLabel("Rotation week",{exact:true}).selectOption("2");
 await expect(page.getByLabel("Item label",{exact:true})).toHaveCount(2);
 await page.getByText("Station setup",{exact:true}).click();
 await page.getByLabel("New station name").fill("Deli");await page.getByLabel("New station FIXY").fill("UNIT DELI");
 await page.getByRole("button",{name:"Create station",exact:true}).click();
 await page.getByLabel("Global One",{exact:true}).check();
 await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();
 await expect.poll(()=>state.saves.length).toBeGreaterThan(0);
 expect(state.get().menus.find(m=>m.id==="opening").items).toHaveLength(2);
 expect(state.get().menus.find(m=>m.id==="core").items).toEqual([oldItem]);
 await page.getByRole("button",{name:"Review Menu",exact:true}).click();
 await expect(page.getByTestId("ssmt-clean-review")).toBeVisible();
 await expect(page.getByText("Participating: Global One")).toBeVisible();
 await expect(page.getByRole("button",{name:"Print menu"})).toBeVisible();
 await page.screenshot({path:"C:/Users/leiss/.buzz/WORK_LOGS/SSMT_OPENING_REVIEW_2026_11_19.png",fullPage:true});
});
test("station port inherits FIXY by default and leaves source rows intact",async({page})=>{
 const state=await isolated(page);await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();
 await page.getByText("Station setup",{exact:true}).click();await page.getByLabel("New station name").fill("Deli");await page.getByLabel("New station FIXY").fill("UNIT DELI");await page.getByRole("button",{name:"Create station",exact:true}).click();
 await page.getByRole("button",{name:"Add from Menu",exact:true}).click();const dialog=page.getByRole("dialog",{name:"Add from Menu",exact:true});
 await expect(dialog.getByLabel("Use this station's FIXY designation")).toBeChecked();
 await dialog.getByLabel("Source menu").selectOption("core");await dialog.getByRole("button",{name:"Select ready items"}).click();await dialog.getByRole("button",{name:"Preview copies"}).click();await expect(dialog).toContainText("R FBB | UNIT DELI | BURGER ENT BF");await dialog.getByRole("button",{name:"Apply copies"}).click();
 await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();await expect.poll(()=>state.get().menus[0].items.length).toBe(3);
 const copy=state.get().menus[0].items.at(-1);expect(copy.stationId).toBeTruthy();expect(copy.mrn).toBe("00042.10");expect(copy.fohColumn).toContain("UNIT DELI");expect(state.get().menus.find(m=>m.id==="core").items).toEqual([oldItem]);
});
test("Experience edits station FIXY and returns menu to draft with owners and history preserved",async({page})=>{
 const state=await isolated(page,{role:"Experience",admin:false});await page.locator('[data-menu-name="Test Opening"]').click();await page.getByLabel("Experience station",{exact:true}).selectOption("grill");
 await page.getByLabel("Experience station FIXY designation").fill("UPDATED GRILL");await page.getByRole("button",{name:"Return to Culinary draft",exact:true}).click();await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();
 await expect.poll(()=>state.get().menus[0].phase).toBe("Culinary draft");expect(state.get().menus[0].owners).toHaveLength(1);expect(state.get().menus[0].phaseHistory.at(-1).to).toBe("Culinary draft");expect(state.get().menus[0].stations[0].fixyDesignation).toBe("UPDATED GRILL");expect(state.get().menus[0].items[0].mrn).toBe("00042.10");
});
test("admin creates a multi-owner assigned opening without changing existing records",async({page})=>{
 const state=await isolated(page);
 await page.getByRole("button",{name:/Menu Assignments/}).click();
 await page.getByLabel("Assignment menu name").fill("New Cafe");
 await page.getByLabel("Assignment menu type").selectOption("New Unit Openings");
 await page.getByLabel("Test Chef",{exact:true}).check();await page.getByLabel("Second Owner",{exact:true}).check();
 await page.getByRole("button",{name:"Create assigned menu"}).click();
 await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();
 await expect.poll(()=>state.get().menus.length).toBe(4);
 const created=state.get().menus.find(m=>m.name==="New Cafe");expect(created.owners).toHaveLength(2);expect(created.items).toHaveLength(0);
 expect(state.get().menus.find(m=>m.id==="core").items).toEqual([oldItem]);
});
test("phone review fits viewport and non-admin has no assignment controls",async({page})=>{
 await page.setViewportSize({width:390,height:844});await isolated(page,{admin:false});
 await expect(page.getByRole("button",{name:/Menu Assignments/})).toHaveCount(0);
 await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();
 await page.getByRole("button",{name:"Review Menu",exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:"C:/Users/leiss/.buzz/WORK_LOGS/SSMT_OPENING_REVIEW_PHONE_2026_11_19.png",fullPage:true});
});
