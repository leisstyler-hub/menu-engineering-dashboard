import {test,expect} from '@playwright/test';
for (const hash of ['', '#error=access_denied&error_code=otp_expired']) {
 test(`recovery landing explains unusable link ${hash}`,async({page})=>{
  await page.route('**/api/**',r=>r.fulfill({json:{ok:true,enabled:true}}));
  await page.goto('/?ssmt=setup'+hash);
  await expect(page.getByRole('heading',{name:'SSMT Reset your password'})).toBeVisible();
  await expect(page.getByText(/request a new reset email/i)).toBeVisible();
  await expect(page.getByRole('button',{name:'Sign in to SSMT',exact:true})).toHaveCount(0);
  await expect(page).not.toHaveURL(/error_code/);
 });
}
test('valid email recovery opens password setup',async({page})=>{
 const actions=[];
 await page.route('**/api/**',r=>{
  if(r.request().method()==='POST')actions.push(r.request().postDataJSON());
  return r.fulfill({json:{ok:true,enabled:true,member:{id:'isolated',role:'Chef'}}});
 });
 await page.goto('/?ssmt=setup#access_token=synthetic-token&type=recovery');
 await expect(page.getByRole('heading',{name:'SSMT Set your password'})).toBeVisible();
 await expect(page).not.toHaveURL(/synthetic-token/);
 await page.getByLabel('New password').fill('Synthetic-password-123');
 await page.getByRole('button',{name:'Set password',exact:true}).click();
 await expect.poll(()=>actions.some(a=>a.action==='password'&&a.password==='Synthetic-password-123')).toBe(true);
});
test('rejected recovery session offers a new email without requiring an old password',async({page})=>{
 const actions=[];
 await page.route('**/api/**',r=>{
  const action=r.request().method()==='POST'?r.request().postDataJSON().action:new URL(r.request().url()).searchParams.get('action');
  actions.push(action);
  return r.fulfill({status:action==='exchange'?401:200,json:action==='exchange'?{ok:false,message:'Expired'}:{ok:true,enabled:true,message:'If registered, an email will arrive.'}});
 });
 await page.goto('/?ssmt=setup#access_token=synthetic-expired&type=recovery');
 await expect(page.getByRole('heading',{name:'SSMT Reset your password'})).toBeVisible();
 await page.getByLabel('Email',{exact:true}).fill('chef@example.test');
 await expect(page.getByLabel('Password',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Send new reset email',exact:true}).click();
 await expect.poll(()=>actions.includes('reset')).toBe(true);
});
