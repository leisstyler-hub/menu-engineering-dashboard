import {test,expect} from '@playwright/test';
test('manage access resends without permission edits and removes from default list with history retained',async({page})=>{
 const member={user_id:'22222222-2222-4222-8222-222222222222',email:'person@example.test',display_name:'Test Person',work_role:'Experience',is_admin:false,active:true};
 let failure=false; const actions=[];await page.route('**/api/**',async route=>{
  const req=route.request(),action=req.method()==='POST'?req.postDataJSON().action:new URL(req.url()).searchParams.get('action');
  if(req.method()==='POST' && action){const b=req.postDataJSON();actions.push(b);if(action==='member')member.active=b.active;}
  if(action==='resend' && failure)return route.fulfill({status:429,json:{ok:false,message:'The email service has reached its sending limit.'}});
  const json=action==='status'?{ok:true,enabled:true}:action==='session'?{ok:true,member:{id:'admin',email:'admin@example.test',name:'Admin',role:'Chef',isAdmin:true}}:action==='members'?{ok:true,members:[...Array.from({length:18},(_,i)=>({...member,user_id:`filler-${i}`,email:`person${i}@example.test`,display_name:`Person ${i}`})),member]}:action==='workspace'?{ok:true,revision:'fixture',workspace:{menus:[],priceBook:[],modifierGroups:[]}}:{ok:true,message:'Setup/reset email requested.'};
  await route.fulfill({json});
 });
 await page.goto('/');await page.getByRole('button',{name:/open ssmt/i}).click();await page.getByRole('button',{name:'Manage access',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Manage access'});const card=dialog.getByRole('group',{name:'Account for person@example.test',exact:true});await expect(dialog.getByText('Test Person',{exact:true})).toBeVisible();
 await dialog.getByLabel('Role for person@example.test').selectOption('IT');
 await card.getByRole('button',{name:'Send setup/reset email',exact:true}).click();
 expect(actions).toEqual([{action:'resend',userId:member.user_id}]);
 failure=true;await card.getByRole('button',{name:'Send setup/reset email',exact:true}).click();await expect(dialog.getByRole('status')).toBeInViewport();await expect(dialog.getByRole('status')).toContainText('sending limit');
 await page.screenshot({path:'C:/Users/leiss/.buzz/WORK_LOGS/SSMT_ACCESS_FEEDBACK_2026_11_24.png'});
 page.on('dialog',d=>d.accept());await card.getByRole('button',{name:'Remove',exact:true}).click();
 await expect(dialog.getByText('Test Person',{exact:true})).toHaveCount(0);
 expect(actions[2]).toMatchObject({action:'member',active:false,role:'Experience',isAdmin:false});
 await dialog.getByLabel('Show removed accounts').check();await expect(dialog.getByText('Test Person',{exact:true})).toBeVisible();await expect(card.getByRole('button',{name:'Send setup/reset email',exact:true})).toBeDisabled();
 await page.screenshot({path:'C:/Users/leiss/.buzz/WORK_LOGS/SSMT_ACCESS_DESKTOP_2026_11_24.png'});
 await page.setViewportSize({width:390,height:844});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.screenshot({path:'C:/Users/leiss/.buzz/WORK_LOGS/SSMT_ACCESS_PHONE_2026_11_24.png'});
});
