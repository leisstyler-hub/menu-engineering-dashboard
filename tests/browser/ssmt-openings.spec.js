import {test,expect} from "@playwright/test";
import {validateOpeningChange} from "../../src/features/ssmt/ssmtOpening.js";
import {validateExperienceChange} from "../../src/features/ssmt/ssmtAudit.js";
const oldItem={id:"old",name:"Burger",label:"BURGER",description:"Beef burger with jalape\ufffdos",mrn:"00042.10",fohColumn:"R FBB | GRILL | BURGER ENT BF",calories:"540",lockedForCentric:false,modifierGroups:[],reviewBasis:{source:"baseline",mrn:"00042.10",description:"Beef burger"}};
async function isolated(page,{role="Chef",admin=true,promo=false,future=false,expirySoon=false,legacyMetadata=false}={}) {
 let shared={menus:[{id:"opening",name:"Test Opening",type:"New Unit Openings",phase:"Culinary draft",stations:[{id:"grill",name:"Grill",fixyDesignation:"UNIT GRILL",globalMenus:[]}],owners:[{id:"one",email:"chef@example.test",name:"Test Chef"}],items:[{...oldItem,stationId:"grill"},{...oldItem,id:"lto",label:"LTO",mrn:"00042.11",stationId:"grill",weeks:[2],reviewBasis:{source:"new"}}]},{id:"core",name:"Grill Core",type:"Core",phase:"IT complete",items:[oldItem]},{id:"global",name:"Global One",type:"Global",phase:"IT complete",items:[{...oldItem,id:"global-item"}]}],modifierGroups:[],priceBook:[],priceBookArchives:[],deletedMenuKeys:[],seedMenuTypeCorrectionsApplied:true,selectedMenuId:"opening"};
 if(legacyMetadata){delete shared.seedMenuTypeCorrectionsApplied;shared.deletedMenuKeys=["preserved-history-key"];}
 if(promo)shared.menus[0]={...shared.menus[0],type:"Promotion",activeEnd:"2020-01-01"};
 if(future)shared.menus[0]={...shared.menus[0],type:"Promotion",activeStart:"2098-01-01",activeEnd:"2099-01-01"};
 if(role==="Experience"){if(promo)shared.menus[0].activeEnd="2099-01-01";shared.menus[0].phase="Experience review";shared.menus[0].items.forEach(i=>i.lockedForCentric=true);}
 let authenticated=true,saveFailure="",loginMember=null,holdSave=false,releaseHeldSave=null,sessionStatus=200;
 const requests=[];const saves=[];const member={id:"one",name:"Test Chef",email:"chef@example.test",role,isAdmin:admin};
 const members=[{user_id:"one",display_name:"Test Chef",email:member.email,active:true},{user_id:"two",display_name:"Second Owner",email:"second@example.test",active:true}];
 await page.route("**/api/storage/records**",r=>r.fulfill({json:{ok:true,records:[]}}));
 await page.route("**/api/smartsheet/records**",r=>r.fulfill({json:{ok:true,records:[]}}));
 await page.route("**/api/ssmt**",async r=>{
 const body=r.request().method()==="POST"?r.request().postDataJSON():null;
 const action=body?.action||new URL(r.request().url()).searchParams.get("action");
 if(body)requests.push(body);
 if(action==="status")return r.fulfill({json:{ok:true,enabled:true}});
 if(action==="session"&&sessionStatus!==200)return r.fulfill({status:sessionStatus,json:{ok:false,message:sessionStatus===403?"Access revoked":"Service unavailable"}});
 if(action==="session")return r.fulfill({status:authenticated?200:401,json:authenticated?{ok:true,member,...(expirySoon?{expiresAt:new Date(Date.now()+65000).toISOString()}:{})}:{ok:false,message:"Session expired"}});
 if(action==="login"){authenticated=true;return r.fulfill({json:{ok:true,member:loginMember||member}});}
 if(action==="logout"){authenticated=false;return r.fulfill({json:{ok:true}});}
 if(action==="calendar")return r.fulfill({json:{ok:true,menus:[]}});
 if(action==="members")return r.fulfill({json:{ok:true,members}});
 if(action==="workspace")return r.fulfill({json:{ok:true,workspace:shared,revision:"r"}});
 if(action==="save") {if(saveFailure){if(saveFailure==="expired")authenticated=false;return r.fulfill({status:saveFailure==="expired"?401:409,json:{ok:false,message:saveFailure==="expired"?"Session expired":"Workspace changed"}});}if(holdSave){holdSave=false;await new Promise(resolve=>{releaseHeldSave=resolve;});}const error=validateOpeningChange(shared,body.workspace,{user_id:"one",work_role:role,is_admin:admin},members)||(role==="Experience"?validateExperienceChange(shared,body.workspace):"");if(error)return r.fulfill({status:403,json:{ok:false,message:error}});shared=body.workspace;saves.push(structuredClone(shared));return r.fulfill({json:{ok:true,revision:"r"}});}
 return r.fulfill({status:400,json:{ok:false,message:`Unexpected fixture action ${action}`}});
 });
 await page.goto("/");await page.getByRole("button",{name:/open ssmt/i}).click();
 return {saves,get:()=>shared,requests,expire:()=>{authenticated=false;saveFailure="expired";},allow:()=>{saveFailure="";},conflict:()=>{saveFailure="conflict";},wrongAccount:()=>{loginMember={...member,id:"other"};},changedRole:()=>{loginMember={...member,role:"IT"};},hold:()=>{holdSave=true;},release:()=>releaseHeldSave?.(),sessionStatus:status=>{sessionStatus=status;}};
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
 await page.screenshot({path:"C:/Users/leiss/.buzz/WORK_LOGS/SSMT_REVIEW_POLISH_LOCAL_2026_11_19.png",fullPage:true});
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
 await page.getByLabel("Assignment menu type").selectOption("New Unit Openings");
 await page.getByLabel("Assignment Building Code").fill("New Cafe");
 await page.getByRole("button",{name:"Select owners",exact:true}).click();await page.getByLabel("Test Chef",{exact:true}).check();await page.getByLabel("Second Owner",{exact:true}).check();
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
 await page.screenshot({path:"C:/Users/leiss/.buzz/WORK_LOGS/SSMT_REVIEW_POLISH_PHONE_LOCAL_2026_11_19.png",fullPage:true});
});

 test("compact admin assignments and opening labels preserve menu data",async({page})=>{
 const state=await isolated(page);await page.setViewportSize({width:1440,height:1000});
 const cards=page.getByTestId("ssmt-home-actions");await expect(cards).toBeVisible();const boxes=await cards.locator(":scope > button").evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y,w:n.getBoundingClientRect().width})));
 expect(boxes).toHaveLength(3);expect(new Set(boxes.map(b=>b.y)).size).toBe(1);expect(Math.max(...boxes.map(b=>b.w))-Math.min(...boxes.map(b=>b.w))).toBeLessThan(2);
 await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();
 await page.getByLabel("New menu type").selectOption("New Unit Openings");await expect(page.getByLabel("Building Code",{exact:true})).toBeVisible();await expect(page.getByLabel("New menu FIXY designation")).toHaveCount(0);
 await page.getByRole("button",{name:"Menu Assignments",exact:true}).click();
 const table=page.getByRole("table",{name:"Menu assignment progress"});await expect(table).toContainText("Grill Core");await expect(table).toContainText("Legacy / no owner needed");
 await expect(page.getByLabel("Assignment FIXY designation")).toBeVisible();await page.getByLabel("Assignment menu type").selectOption("New Unit Openings");await expect(page.getByLabel("Assignment Building Code")).toBeVisible();await expect(page.getByLabel("Assignment FIXY designation")).toHaveCount(0);
 await table.getByRole("row").filter({hasText:"Test Opening"}).getByRole("button",{name:"Review Menu",exact:true}).click();await expect(page.getByTestId("ssmt-clean-review")).toBeVisible();await expect(page.getByRole("button",{name:"Export PDF",exact:true})).toBeVisible();await expect(page.getByRole("link",{name:"Email menu",exact:true})).toHaveAttribute("href",/^mailto:/);expect(state.saves).toHaveLength(0);
 await page.evaluate(()=>{window.print=()=>{window.__printed=true;};});await page.getByRole("button",{name:"Export PDF",exact:true}).click();expect(await page.evaluate(()=>window.__printed)).toBe(true);await expect(page.getByRole("status")).toContainText("Save as PDF");
 await expect(page.getByText("Share PDF",{exact:true})).toHaveCount(0);await expect(page.getByRole("button",{name:"Approve this menu revision"})).toHaveCount(0);
 await page.getByRole("button",{name:"Back to Menu Assignments",exact:true}).click();await expect(page.getByRole("table",{name:"Menu assignment progress"})).toBeVisible();
 await page.screenshot({path:"C:/Users/leiss/.buzz/WORK_LOGS/SSMT_REVIEW_POLISH_COMPACT_2026_11_19.png",fullPage:true});
 });

test("promo Experience and review have no rotation and past assignments stay visible",async({page})=>{
 const state=await isolated(page,{promo:true});await page.getByRole("button",{name:/Menu Assignments/}).click();const row=page.getByRole("table",{name:"Menu assignment progress"}).getByRole("row").filter({hasText:"Test Opening"});await expect(row).toHaveCount(0);await page.getByRole("button",{name:/Show Hibernated/}).click();await expect(row).toContainText("Past / hibernated");await expect(row).toContainText("Test Chef");await row.getByRole("button",{name:"Review Menu",exact:true}).click();await expect(page.getByTestId("ssmt-clean-review")).toBeVisible();await expect(page.getByLabel("Rotation week",{exact:true})).toHaveCount(0);await expect(page.getByText("LTO",{exact:true})).toBeVisible();await expect(page.getByTestId("ssmt-clean-review")).not.toContainText("\ufffd");expect(state.saves).toHaveLength(0);
});
test("promo Experience has no week selector",async({page})=>{
 await isolated(page,{promo:true,role:"Experience",admin:false});await page.locator('[data-menu-name="Test Opening"]').click();await expect(page.getByTestId("ssmt-experience-table-scroll")).toBeVisible();await expect(page.getByLabel("Rotation week",{exact:true})).toHaveCount(0);
});

test("future assigned menus remain visible without showing hibernated records",async({page})=>{
 const state=await isolated(page,{future:true});await page.getByRole("button",{name:/Menu Assignments/}).click();await expect(page.getByRole("table",{name:"Menu assignment progress"})).toContainText("Test Opening");await expect(page.getByRole("button",{name:/Show Hibernated/})).toHaveAttribute("aria-pressed","false");expect(state.saves).toHaveLength(0);
});

test("expired save blocks editing and same-account sign-in retains draft and revision",async({page})=>{
 const state=await isolated(page);await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();await page.getByLabel("Opening station",{exact:true}).selectOption("grill");await page.getByLabel("Item label",{exact:true}).first().fill("Retained draft");state.expire();await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();await expect(page.getByRole("heading",{name:"You've been logged out",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Download private draft"})).toBeVisible();await expect(page.getByLabel("Item label",{exact:true}).first()).not.toBeVisible();await page.screenshot({path:"C:/Users/leiss/.buzz/WORK_LOGS/SSMT_SESSION_RECOVERY_2026_11_19.png",fullPage:true});state.allow();await page.getByLabel("Session password").fill("fixture-password");await page.getByRole("button",{name:"Sign in and resume draft",exact:true}).click();await expect(page.getByLabel("Item label",{exact:true}).first()).toHaveValue("RETAINED DRAFT");state.conflict();await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();await expect(page.getByRole("alert")).toContainText("Workspace changed");expect(state.saves).toHaveLength(0);expect(state.requests.filter(r=>r.action==="save").every(r=>r.revision==="r")).toBe(true);await expect(page.getByLabel("Item label",{exact:true}).first()).toHaveValue("RETAINED DRAFT");
});
test("a different account cannot unlock the retained draft",async({page})=>{
 const state=await isolated(page);await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();state.expire();await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();await expect(page.getByRole("heading",{name:"You've been logged out",exact:true})).toBeVisible();state.wrongAccount();await page.getByLabel("Session password").fill("fixture-password");await page.getByRole("button",{name:"Sign in and resume draft",exact:true}).click();await expect(page.getByText(/original account and permissions/)).toBeVisible();await expect(page.getByLabel("Session password")).toBeVisible();expect(state.saves).toHaveLength(0);
});

test("sign out saves the latest edits before locking the screen",async({page})=>{
 const state=await isolated(page);await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();await page.getByLabel("Opening station",{exact:true}).selectOption("grill");await page.getByLabel("Item label",{exact:true}).first().fill("Saved on logout");await page.getByRole("button",{name:"Sign out",exact:true}).click();await expect(page.getByRole("heading",{name:"You've been logged out",exact:true})).toBeVisible();await expect(page.getByRole("status")).toContainText('was saved before logging out');expect(state.get().menus[0].items[0].label).toBe("SAVED ON LOGOUT");expect(state.requests.map(r=>r.action).slice(-2)).toEqual(["save","logout"]);
});
test("known session deadline saves and locks before expiration",async({page})=>{
 await page.clock.install();const state=await isolated(page,{expirySoon:true});await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();await page.getByLabel("Opening station",{exact:true}).selectOption("grill");await page.getByLabel("Item label",{exact:true}).first().fill("Before timeout");await page.clock.fastForward(6000);await expect(page.getByRole("heading",{name:"You've been logged out",exact:true})).toBeVisible();expect(state.get().menus[0].items[0].label).toBe("BEFORE TIMEOUT");
});
test("role changes cannot unlock a retained draft and private backup keeps original data",async({page})=>{
 const state=await isolated(page);await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();state.expire();await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();await expect(page.getByLabel("Session password")).toBeVisible();const waiting=page.waitForEvent("download");await page.getByRole("button",{name:"Download private draft"}).click();const download=await waiting;const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);const backup=JSON.parse(Buffer.concat(chunks).toString());expect(backup.baseRevision).toBe("r");expect(backup.ownerId).toBe("one");expect(backup.workspace.menus[0].items[0].mrn).toBe("00042.10");expect(backup.workspace.menus[0].items[0].description).toContain("\ufffd");state.changedRole();await page.getByLabel("Session password").fill("fixture-password");await page.getByRole("button",{name:"Sign in and resume draft",exact:true}).click();await expect(page.getByText(/original account and permissions/)).toBeVisible();expect(state.saves).toHaveLength(0);
});

test("a protection flush waiting on a save is cancelled by expiry",async({page})=>{
 const state=await isolated(page);await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();await page.getByLabel("Opening station",{exact:true}).selectOption("grill");await page.getByLabel("Item label",{exact:true}).first().fill("First save");state.hold();await page.getByRole("button",{name:"Save SSMT workspace",exact:true}).click();await expect.poll(()=>state.requests.filter(r=>r.action==="save").length).toBe(1);await page.getByLabel("Item label",{exact:true}).first().fill("Newer unsaved draft");await page.getByRole("button",{name:"Sign out",exact:true}).click();await expect(page.getByRole("heading",{name:"Protecting your open menu"})).toBeVisible();await page.evaluate(()=>window.dispatchEvent(new CustomEvent("ssmt-session-expired")));state.release();await expect(page.getByTestId("ssmt-workspace-sync")).toHaveAttribute("title",/workspace saved/);await expect(page.getByRole("heading",{name:"You've been logged out",exact:true})).toBeVisible();expect(state.requests.filter(r=>r.action==="save")).toHaveLength(1);expect(state.requests.some(r=>r.action==="logout")).toBe(false);expect(state.get().menus[0].items[0].label).toBe("FIRST SAVE");
});

test("offline session checks pause editing without losing the draft",async({page})=>{
 const state=await isolated(page);await page.getByRole("button",{name:"Menu Selector / New Menu",exact:true}).click();await page.locator('[data-menu-name="Test Opening"]').click();await page.getByLabel("Opening station",{exact:true}).selectOption("grill");await page.getByLabel("Item label",{exact:true}).first().fill("Offline draft");expect(await page.evaluate(()=>{const event=new Event("beforeunload",{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;})).toBe(true);state.sessionStatus(503);await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await expect(page.getByRole("heading",{name:"Editing paused",exact:true})).toBeVisible();await expect(page.getByText(/Some changes are not confirmed saved/)).toBeVisible();state.sessionStatus(200);await page.getByRole("button",{name:"Check connection again",exact:true}).click();await expect(page.getByLabel("Item label",{exact:true}).first()).toHaveValue("OFFLINE DRAFT");expect(state.saves).toHaveLength(0);
});
test("revoked membership pauses access without discarding menu data",async({page})=>{
 const state=await isolated(page);await expect(page.getByTestId("ssmt-home-actions")).toBeVisible();state.sessionStatus(403);await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await expect(page.getByRole("heading",{name:"Editing paused",exact:true})).toBeVisible();await expect(page.getByRole("status")).toContainText("contact an admin");expect(state.saves).toHaveLength(0);
});

test("clean legacy workspace does not become dirty or save on logout",async({page})=>{
 const state=await isolated(page,{legacyMetadata:true});await expect(page.getByTestId("ssmt-workspace-sync")).toHaveAttribute("title","Loaded shared SSMT workspace.");expect(await page.evaluate(()=>{const event=new Event("beforeunload",{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;})).toBe(false);await page.getByRole("button",{name:"Sign out",exact:true}).click();await expect(page.getByRole("heading",{name:"You've been logged out",exact:true})).toBeVisible();expect(state.saves).toHaveLength(0);expect(state.get().deletedMenuKeys).toEqual(["preserved-history-key"]);expect(state.get().seedMenuTypeCorrectionsApplied).toBeUndefined();
});
