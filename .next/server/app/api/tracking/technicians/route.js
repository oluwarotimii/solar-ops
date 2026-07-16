"use strict";(()=>{var e={};e.id=7301,e.ids=[7301],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},76162:e=>{e.exports=require("stream")},21764:e=>{e.exports=require("util")},8678:e=>{e.exports=import("pg")},9008:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.r(r),t.d(r,{originalPathname:()=>g,patchFetch:()=>l,requestAsyncStorage:()=>p,routeModule:()=>c,serverHooks:()=>m,staticGenerationAsyncStorage:()=>d});var i=t(73278),n=t(45002),o=t(54877),a=t(73395),u=e([a]);a=(u.then?(await u)():u)[0];let c=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/tracking/technicians/route",pathname:"/api/tracking/technicians",filename:"route",bundlePath:"app/api/tracking/technicians/route"},resolvedPagePath:"C:\\Users\\ADMIN\\Desktop\\code\\Rotex\\solar-ops\\app\\api\\tracking\\technicians\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:p,staticGenerationAsyncStorage:d,serverHooks:m}=c,g="/api/tracking/technicians/route";function l(){return(0,o.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:d})}s()}catch(e){s(e)}})},73395:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.r(r),t.d(r,{GET:()=>l});var i=t(71309),n=t(1035),o=t(47392),a=t(16910),u=e([n,o,a]);async function l(e){try{let{user:r,response:t}=await (0,o.P)(e);if(t)return t;if(!r||!(0,a.Fs)(r,"tracking:read"))return i.NextResponse.json({error:"Forbidden"},{status:403});let s=(0,n.JF)(),u=(await s`
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        j.id as job_id,
        j.title as job_title,
        j.location_address as job_location,
        j.status as job_status,
        gl.latitude,
        gl.longitude,
        gl.timestamp as last_gps_timestamp,
        gl.journey_type,
        (
          SELECT timestamp 
          FROM gps_logs 
          WHERE user_id = u.id AND journey_type = 'start' 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) as journey_start_time
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN job_technicians jt ON jt.technician_id = u.id
      LEFT JOIN jobs j ON jt.job_id = j.id AND j.status IN ('assigned', 'in_progress')
      LEFT JOIN LATERAL (
        SELECT latitude, longitude, timestamp, journey_type
        FROM gps_logs
        WHERE user_id = u.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) gl ON true
      WHERE r.name = 'Technician' AND u.status = 'active'
      ORDER BY u.first_name, u.last_name
    `).map(e=>{let r=(0,n.zW)(e),t="offline";if(r.lastGpsTimestamp){let e=new Date(r.lastGpsTimestamp),s=(new Date().getTime()-e.getTime())/6e4;s<5&&"in_progress"===r.jobStatus?t="active":s<30&&(t="idle")}return{user:{id:r.userId,firstName:r.firstName,lastName:r.lastName,email:r.email,phone:r.phone},currentJob:r.jobId?{id:r.jobId,title:r.jobTitle,locationAddress:r.jobLocation,status:r.jobStatus}:void 0,lastGPSLog:r.latitude?{latitude:r.latitude,longitude:r.longitude,timestamp:r.lastGpsTimestamp,journeyType:r.journeyType}:void 0,status:t,journeyStartTime:r.journeyStartTime}});return i.NextResponse.json(u)}catch(e){return i.NextResponse.json({error:"Internal server error"},{status:500})}}[n,o,a]=u.then?(await u)():u,s()}catch(e){s(e)}})},47392:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{P:()=>a});var i=t(71309),n=t(16910),o=e([n]);async function a(e){let r=e.cookies.get("token")?.value;if(!r){let t=e.headers.get("authorization");t&&t.startsWith("Bearer ")&&(r=t.substring(7))}if(!r)return{user:null,response:i.NextResponse.json({error:"Unauthorized"},{status:401})};try{let e=(0,n.WX)(r);if(!e)return{user:null,response:i.NextResponse.json({error:"Unauthorized"},{status:401})};let t=await (0,n.GA)(e.userId);if(!t)return{user:null,response:i.NextResponse.json({error:"Unauthorized"},{status:401})};return{user:t}}catch(e){return console.error("API authentication error:",e),{user:null,response:i.NextResponse.json({error:"Unauthorized"},{status:401})}}}n=(o.then?(await o)():o)[0],s()}catch(e){s(e)}})},16910:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{CX:()=>g,Fs:()=>f,GA:()=>m,Gv:()=>c,RA:()=>p,WX:()=>d,c_:()=>l});var i=t(93981),n=t(67390),o=t.n(n),a=t(1035),u=e([a]);a=(u.then?(await u)():u)[0];let h=process.env.JWT_SECRET||"your-secret-key-change-in-production";async function l(e){return i.ZP.hash(e,12)}async function c(e,r){console.log("[Auth Debug] Verifying password...");let t=await i.ZP.compare(e,r);return console.log(`[Auth Debug] Password verification result: ${t}`),t}function p(e){console.log(`[Auth Debug] Generating token for userId: ${e}`);let r=o().sign({userId:e},h,{expiresIn:"7d"});return console.log(`[Auth Debug] Token generated (first 10 chars): ${r.substring(0,10)}...`),r}function d(e){try{return o().verify(e,h)}catch{return null}}async function m(e){try{let r=await (0,a.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${e} AND u.status = 'active'
    `;if(0===r.length)return null;let t=(0,a.zW)(r[0]);return t.roleName&&(t.role={id:t.roleId,name:t.roleName,description:t.roleDescription,isAdmin:t.roleIsAdmin,permissions:"string"==typeof t.rolePermissions?JSON.parse(t.rolePermissions):t.rolePermissions}),t}catch(e){return console.error("Error getting user by ID:",e),null}}async function g(e){try{console.log(`[Auth Debug] Attempting to get user by email: ${e}`);let r=await (0,a.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${e}
    `;if(0===r.length)return console.log(`[Auth Debug] User with email ${e} not found.`),null;let t=(0,a.zW)(r[0]);return console.log(`[Auth Debug] User found: ${t.email}, Status: ${t.status}`),t.roleName&&(t.role={id:t.roleId,name:t.roleName,description:t.roleDescription,isAdmin:t.roleIsAdmin,permissions:t.rolePermissions}),t}catch(e){return console.error("Error getting user by email:",e),null}}function f(e,r){if(!e.role||!e.role.permissions)return!1;if(!0===e.role.permissions.all)return!0;let t=r.split(":"),s=e.role.permissions;for(let e=0;e<t.length;e++){let r=t[e],i=t.slice(e).join(":");if(!0===s[i])return!0;if(void 0===s[r])break;if("boolean"==typeof s[r])return s[r];s=s[r]}return!1}s()}catch(e){s(e)}})},1035:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{JF:()=>a,_B:()=>c,zW:()=>function e(r){if(null==r)return r;if(Array.isArray(r))return r.map(e);if("object"!=typeof r||r instanceof Date)return r;let t={};for(let[s,i]of Object.entries(r))t[s.replace(/_([a-z])/g,(e,r)=>r.toUpperCase())]=e(i);return t}});var i=t(53524),n=t(23907),o=e([n]);n=(o.then?(await o)():o)[0];let l=globalThis,c=function(){if(!l.prisma){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required for PrismaClient");let e=new n.g({connectionString:process.env.DATABASE_URL});l.prisma=new i.PrismaClient({adapter:e})}return l.prisma}();function a(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required");return(e,...r)=>c.$queryRaw(e,...r)}function u(e){if(null==e)return e;if(Array.isArray(e))return e.map(u);if("object"!=typeof e)return e;let r={};for(let[t,s]of Object.entries(e))r[t.replace(/[A-Z]/g,e=>`_${e.toLowerCase()}`)]=u(s);return r}s()}catch(e){s(e)}})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[9379,4739,1309,3981,7390],()=>t(9008));module.exports=s})();