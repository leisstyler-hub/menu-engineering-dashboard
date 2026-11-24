import {useEffect,useRef,useState} from "react";
import {ssmtRequest} from "./ssmtClient.js";
const sameAccess=(a,b)=>a?.id===b?.id&&a?.role===b?.role&&a?.isAdmin===b?.isAdmin;
export default function useSsmtSessionGuard(member,enabled,initialExpiry) {
 const bridge=useRef({blocked:false,editor:null});
 const generation=useRef(0),checking=useRef(false),deadline=useRef(null);
 const [block,setBlock]=useState(null),[notice,setNotice]=useState("");
 const [expiry,setExpiry]=useState(null);
 const info=()=>bridge.current.editor?.info()||{loaded:false,dirty:false,inFlight:false,name:"Menu"};
 const stop=(kind,message)=>{generation.current++;bridge.current.protection=null;bridge.current.blocked=true;setBlock({kind,message,...info()});};
 const setDeadline=(value,fresh=false)=>{
  const at=Date.parse(value);if(!Number.isFinite(at)){if(fresh){deadline.current=null;setExpiry(null);}return;}
  deadline.current=fresh||!deadline.current?at:Math.min(at,deadline.current);setExpiry(deadline.current);
 };
 const verify=async(lock=false)=>{
  if(checking.current||!enabled||(bridge.current.blocked&&!lock))return;
  const ticket=++generation.current;checking.current=ticket;
  if(lock){bridge.current.blocked=true;setBlock({kind:"checking",message:"Checking your SSMT session. Your draft is retained.",...info()});}
  try{
   const result=await ssmtRequest("session");if(ticket!==generation.current)return;
   if(!sameAccess(member,result.member)){stop("access","Your access changed. Resume with the original account and permissions, or contact an admin.");return;}
   setDeadline(result.expiresAt);
   if(lock){bridge.current.blocked=false;setBlock(null);}
  }catch(error){if(ticket!==generation.current)return;stop(error.status===401?"expired":error.status===403?"access":"connection",error.status===401?"Your session expired. Unsaved changes are retained in this tab.":error.status===403?"Your SSMT access is not active. Your draft is retained; contact an admin.":"SSMT access could not be verified. Editing is paused; your draft is retained.");}
  finally{if(checking.current===ticket)checking.current=false;}
 };
 const pause=async()=>{
  if(bridge.current.blocked)return;
  stop("saving","Saving your menu before logging out. Keep this tab open.");
  const ticket=generation.current;bridge.current.protection=ticket;
  try{
   const result=info();
   if(!result.loaded)throw new Error("The workspace is not ready; no save is confirmed.");
   if(result.dirty||result.inFlight){
    const saved=await Promise.race([bridge.current.editor.save(ticket),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);
    if(ticket!==generation.current)return;
    if(!saved||info().dirty||info().inFlight)throw new Error("The latest changes could not be confirmed saved. Your draft remains in this tab.");
   }
   await ssmtRequest("logout",{});if(ticket!==generation.current)return;
   stop("expired",result.dirty?`Menu "${result.name}" was saved before logging out.`:`Menu "${result.name}" has no unsaved changes. You have been logged out.`);
  }catch(error){if(ticket===generation.current)stop("connection",error.message||"Save was not confirmed. Keep this tab open; your draft is retained.");}
 };
 const resume=async(password)=>{
  const ticket=++generation.current;bridge.current.protection=null;
  const result=await ssmtRequest("login",{email:member.email,password});
  if(ticket!==generation.current)return;
  if(!sameAccess(member,result.member))throw new Error("Use the original account and permissions to resume this draft. Contact an admin if access changed.");
  setDeadline(result.expiresAt,true);bridge.current.blocked=false;setBlock(null);setNotice("Signed in. Your open draft and its original revision are retained. Press Save to submit your changes.");
 };
 useEffect(()=>{
  if(!enabled||!member)return;
  setDeadline(initialExpiry,true);
  const expired=()=>stop("expired","Your session expired. Unsaved changes are retained in this tab; sign in again to continue.");
  const focus=()=>{if(!bridge.current.blocked)verify(false);};
  const recheck=()=>{stop("checking","Verifying your account and permissions. Your draft is retained.");checking.current=false;verify(true);};
  const visibility=()=>{if(document.visibilityState==="visible")focus();};
  const unload=event=>{if(info().dirty||info().inFlight){event.preventDefault();event.returnValue="";}};
  window.addEventListener("ssmt-session-expired",expired);window.addEventListener("ssmt-session-recheck",recheck);window.addEventListener("focus",focus);document.addEventListener("visibilitychange",visibility);window.addEventListener("beforeunload",unload);
  const interval=setInterval(()=>verify(false),30000);
  return()=>{generation.current++;clearInterval(interval);window.removeEventListener("ssmt-session-expired",expired);window.removeEventListener("ssmt-session-recheck",recheck);window.removeEventListener("focus",focus);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("beforeunload",unload);};
 },[enabled,member?.id,member?.role,member?.isAdmin]);
 useEffect(()=>{
  if(!enabled||!expiry)return;
  const timer=setTimeout(()=>pause(),Math.max(0,expiry-Date.now()-60000));return()=>clearTimeout(timer);
 },[enabled,expiry]);
 bridge.current.isProtectionValid=ticket=>ticket!=null&&bridge.current.protection===ticket&&generation.current===ticket;
 bridge.current.register=editor=>{bridge.current.editor=editor;return()=>{if(bridge.current.editor===editor)bridge.current.editor=null;};};
 bridge.current.leave=action=>{if((info().dirty||info().inFlight)&&!window.confirm("This menu has unsaved changes. Cancel to save or download your draft before leaving. Leave anyway?"))return;action();};
 return {bridge:bridge.current,block,notice,pause,resume,retry:()=>verify(true),download:()=>bridge.current.editor?.download(),canChangePassword:async()=>{if(info().dirty||info().inFlight){if(!await bridge.current.editor.save())return false;}return !info().dirty;}};
}
