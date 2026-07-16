"use strict";(()=>{var e={};e.id=7346,e.ids=[7346],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},76162:e=>{e.exports=require("stream")},21764:e=>{e.exports=require("util")},8678:e=>{e.exports=import("pg")},55737:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.r(r),t.d(r,{originalPathname:()=>h,patchFetch:()=>u,requestAsyncStorage:()=>d,routeModule:()=>c,serverHooks:()=>m,staticGenerationAsyncStorage:()=>p});var o=t(73278),n=t(45002),i=t(54877),a=t(80816),l=e([a]);a=(l.then?(await l)():l)[0];let c=new o.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/dashboard/spillover-jobs/route",pathname:"/api/dashboard/spillover-jobs",filename:"route",bundlePath:"app/api/dashboard/spillover-jobs/route"},resolvedPagePath:"C:\\Users\\ADMIN\\Desktop\\code\\Rotex\\solar-ops\\app\\api\\dashboard\\spillover-jobs\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:m}=c,h="/api/dashboard/spillover-jobs/route";function u(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:p})}s()}catch(e){s(e)}})},80816:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.r(r),t.d(r,{GET:()=>u});var o=t(71309),n=t(1035),i=t(47392),a=t(16910),l=e([n,i,a]);async function u(e){let{user:r,response:t}=await (0,i.P)(e);if(t)return t;if(!r)return o.NextResponse.json({error:"Unauthorized"},{status:401});try{let e=(0,n.JF)(),t=new Date,s=new Date(t.getFullYear(),t.getMonth(),1),i=((0,a.Fs)(r,"jobs:read:all")?await e`
        SELECT
          j.id,
          j.title,
          j.status,
          j.scheduled_date,
          j.location_address,
          jt.name as job_type_name,
          jt.color as job_type_color
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        WHERE
          j.created_at < ${s.toISOString().split("T")[0]} AND
          j.status NOT IN ('completed', 'cancelled')
        ORDER BY j.scheduled_date ASC;
      `:await e`
        SELECT
          j.id,
          j.title,
          j.status,
          j.scheduled_date,
          j.location_address,
          jt.name as job_type_name,
          jt.color as job_type_color
        FROM jobs j
        INNER JOIN job_technicians jtech ON j.id = jtech.job_id
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        WHERE
          jtech.technician_id = ${r.id} AND
          j.created_at < ${s.toISOString().split("T")[0]} AND
          j.status NOT IN ('completed', 'cancelled')
        ORDER BY j.scheduled_date ASC;
      `).map(e=>({...e,scheduledDate:e.scheduled_date instanceof Date?new Date(e.scheduled_date.getTime()-6e4*e.scheduled_date.getTimezoneOffset()).toISOString().split("T")[0]:null}));return o.NextResponse.json(i.map(n.zW))}catch(e){return o.NextResponse.json({error:"Internal server error"},{status:500})}}[n,i,a]=l.then?(await l)():l,s()}catch(e){s(e)}})},47392:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{P:()=>a});var o=t(71309),n=t(16910),i=e([n]);async function a(e){let r=e.cookies.get("token")?.value;if(!r){let t=e.headers.get("authorization");t&&t.startsWith("Bearer ")&&(r=t.substring(7))}if(!r)return{user:null,response:o.NextResponse.json({error:"Unauthorized"},{status:401})};try{let e=(0,n.WX)(r);if(!e)return{user:null,response:o.NextResponse.json({error:"Unauthorized"},{status:401})};let t=await (0,n.GA)(e.userId);if(!t)return{user:null,response:o.NextResponse.json({error:"Unauthorized"},{status:401})};return{user:t}}catch(e){return console.error("API authentication error:",e),{user:null,response:o.NextResponse.json({error:"Unauthorized"},{status:401})}}}n=(i.then?(await i)():i)[0],s()}catch(e){s(e)}})},16910:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{CX:()=>h,Fs:()=>j,GA:()=>m,Gv:()=>c,RA:()=>d,WX:()=>p,c_:()=>u});var o=t(93981),n=t(67390),i=t.n(n),a=t(1035),l=e([a]);a=(l.then?(await l)():l)[0];let f=process.env.JWT_SECRET||"your-secret-key-change-in-production";async function u(e){return o.ZP.hash(e,12)}async function c(e,r){console.log("[Auth Debug] Verifying password...");let t=await o.ZP.compare(e,r);return console.log(`[Auth Debug] Password verification result: ${t}`),t}function d(e){console.log(`[Auth Debug] Generating token for userId: ${e}`);let r=i().sign({userId:e},f,{expiresIn:"7d"});return console.log(`[Auth Debug] Token generated (first 10 chars): ${r.substring(0,10)}...`),r}function p(e){try{return i().verify(e,f)}catch{return null}}async function m(e){try{let r=await (0,a.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${e} AND u.status = 'active'
    `;if(0===r.length)return null;let t=(0,a.zW)(r[0]);return t.roleName&&(t.role={id:t.roleId,name:t.roleName,description:t.roleDescription,isAdmin:t.roleIsAdmin,permissions:"string"==typeof t.rolePermissions?JSON.parse(t.rolePermissions):t.rolePermissions}),t}catch(e){return console.error("Error getting user by ID:",e),null}}async function h(e){try{console.log(`[Auth Debug] Attempting to get user by email: ${e}`);let r=await (0,a.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${e}
    `;if(0===r.length)return console.log(`[Auth Debug] User with email ${e} not found.`),null;let t=(0,a.zW)(r[0]);return console.log(`[Auth Debug] User found: ${t.email}, Status: ${t.status}`),t.roleName&&(t.role={id:t.roleId,name:t.roleName,description:t.roleDescription,isAdmin:t.roleIsAdmin,permissions:t.rolePermissions}),t}catch(e){return console.error("Error getting user by email:",e),null}}function j(e,r){if(!e.role||!e.role.permissions)return!1;if(!0===e.role.permissions.all)return!0;let t=r.split(":"),s=e.role.permissions;for(let e=0;e<t.length;e++){let r=t[e],o=t.slice(e).join(":");if(!0===s[o])return!0;if(void 0===s[r])break;if("boolean"==typeof s[r])return s[r];s=s[r]}return!1}s()}catch(e){s(e)}})},1035:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{JF:()=>a,_B:()=>c,zW:()=>function e(r){if(null==r)return r;if(Array.isArray(r))return r.map(e);if("object"!=typeof r||r instanceof Date)return r;let t={};for(let[s,o]of Object.entries(r))t[s.replace(/_([a-z])/g,(e,r)=>r.toUpperCase())]=e(o);return t}});var o=t(53524),n=t(23907),i=e([n]);n=(i.then?(await i)():i)[0];let u=globalThis,c=function(){if(!u.prisma){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required for PrismaClient");let e=new n.g({connectionString:process.env.DATABASE_URL});u.prisma=new o.PrismaClient({adapter:e})}return u.prisma}();function a(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required");return(e,...r)=>c.$queryRaw(e,...r)}function l(e){if(null==e)return e;if(Array.isArray(e))return e.map(l);if("object"!=typeof e)return e;let r={};for(let[t,s]of Object.entries(e))r[t.replace(/[A-Z]/g,e=>`_${e.toLowerCase()}`)]=l(s);return r}s()}catch(e){s(e)}})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[9379,4739,1309,3981,7390],()=>t(55737));module.exports=s})();