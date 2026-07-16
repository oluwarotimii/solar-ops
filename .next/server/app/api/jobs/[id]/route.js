"use strict";(()=>{var e={};e.id=6301,e.ids=[6301],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},76162:e=>{e.exports=require("stream")},21764:e=>{e.exports=require("util")},8678:e=>{e.exports=import("pg")},85663:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>u,requestAsyncStorage:()=>c,routeModule:()=>d,serverHooks:()=>_,staticGenerationAsyncStorage:()=>p});var n=r(73278),o=r(45002),i=r(54877),a=r(10778),l=e([a]);a=(l.then?(await l)():l)[0];let d=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/jobs/[id]/route",pathname:"/api/jobs/[id]",filename:"route",bundlePath:"app/api/jobs/[id]/route"},resolvedPagePath:"C:\\Users\\ADMIN\\Desktop\\code\\Rotex\\solar-ops\\app\\api\\jobs\\[id]\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:c,staticGenerationAsyncStorage:p,serverHooks:_}=d,f="/api/jobs/[id]/route";function u(){return(0,i.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:p})}s()}catch(e){s(e)}})},10778:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{DELETE:()=>p,GET:()=>c,PUT:()=>_});var n=r(71309),o=r(93389),i=r(1035),a=r(47392),l=r(16910),u=r(31689),d=e([i,a,l,u]);[i,a,l,u]=d.then?(await d)():d;let f=o.Ry({title:o.Z_().min(1),description:o.Z_().optional(),jobTypeId:o.Z_().min(1),priority:o.Z_().optional(),locationAddress:o.Z_().min(1),locationLat:o.Z_().optional(),locationLng:o.Z_().optional(),scheduledDate:o.Z_().optional(),scheduledTime:o.Z_().optional(),jobValue:o.Rx().optional(),instructions:o.Z_().optional(),status:o.Z_().optional(),assignedUsers:o.IX(o.Ry({userId:o.Z_(),role:o.Z_()})).optional()});async function c(e,{params:t}){try{let{user:r,response:s}=await (0,a.P)(e);if(s)return s;if(!r||!(0,l.Fs)(r,"jobs:read"))return n.NextResponse.json({error:"Forbidden"},{status:403});let o=t.id,u=(0,i.JF)(),d=await u`
      SELECT 
        j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      WHERE j.id = ${o}
    `;if(0===d.length)return n.NextResponse.json({error:"Job not found"},{status:404});let c=(0,i.zW)(d[0]),p=await u`
      SELECT
        jt.technician_id,
        jt.role,
        u.first_name,
        u.last_name
      FROM job_technicians jt
      JOIN users u ON jt.technician_id = u.id
      WHERE jt.job_id = ${o}
    `;return c.technicians=p.map(e=>(0,i.zW)(e)),c.scheduledDate=c.scheduledDate instanceof Date?new Date(c.scheduledDate.getTime()-6e4*c.scheduledDate.getTimezoneOffset()).toISOString().split("T")[0]:null,n.NextResponse.json(c)}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}async function p(e,{params:t}){try{let{user:r,response:s}=await (0,a.P)(e);if(s)return s;if(!r||!(0,l.Fs)(r,"jobs:delete"))return n.NextResponse.json({error:"Forbidden"},{status:403});let o=t.id,d=(0,i.JF)(),c=await d`SELECT title FROM jobs WHERE id = ${o}`;if(0===c.length)return n.NextResponse.json({error:"Job not found"},{status:404});let p=c[0].title;return await d`
      DELETE FROM accrued_values WHERE job_id = ${o}
    `,await d`
      DELETE FROM jobs WHERE id = ${o}
    `,await (0,u.b)({userId:r.id,action:"job_delete",targetType:"job",targetId:o,details:{title:p},request:e}),n.NextResponse.json({message:"Job deleted successfully"})}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}async function _(e,{params:t}){try{let{user:r,response:s}=await (0,a.P)(e);if(s)return s;if(!r||!(0,l.Fs)(r,"jobs:update"))return n.NextResponse.json({error:"Forbidden"},{status:403});let o=t.id,d=await e.json(),c=f.safeParse(d);if(!c.success)return n.NextResponse.json({error:c.error.format()},{status:400});let p=c.data,_=(0,i.JF)(),h=await _`SELECT * FROM jobs WHERE id = ${o}`;if(0===h.length)return n.NextResponse.json({error:"Job not found"},{status:404});let m=h[0],j=(await _`SELECT technician_id FROM job_technicians WHERE job_id = ${o}`).map(e=>e.technician_id);if(await _`
      UPDATE jobs
      SET
        title = ${p.title},
        description = ${p.description||null},
        job_type_id = ${p.jobTypeId},
        priority = ${p.priority||"medium"},
        location_address = ${p.locationAddress},
        location_lat = ${p.locationLat||null},
        location_lng = ${p.locationLng||null},
        scheduled_date = ${p.scheduledDate||null},
        scheduled_time = ${p.scheduledTime||null},
        job_value = ${p.jobValue||0},
        instructions = ${p.instructions||null},
        status = ${p.status||m.status}
      WHERE id = ${o}
    `,await _`
      DELETE FROM job_technicians WHERE job_id = ${o}
    `,p.assignedUsers&&p.assignedUsers.length>0)for(let e of p.assignedUsers)await _`
          INSERT INTO job_technicians (job_id, technician_id, role)
          VALUES (${o}, ${e.userId}, ${e.role})
        `,await _`
          INSERT INTO notifications (recipient_id, sender_id, title, message, type, related_job_id)
          VALUES (
            ${e.userId},
            ${r.id},
            'Job Details Updated',
            ${`The details for job "${p.title}" have been updated.`},
            'job_update',
            ${o}
          )
        `;await (0,u.b)({userId:r.id,action:"job_update",targetType:"job",targetId:o,details:{changes:function(e,t){let r={};for(let s of["title","description","priority","location_address","location_lat","location_lng","scheduled_date","scheduled_time","job_value","instructions","status"]){let n=e[s],o=t[s];void 0!==o&&o!==n&&(r[s]={old:n,new:o})}return void 0!==t.jobTypeId&&t.jobTypeId!==e.job_type_id&&(r.job_type_id={old:e.job_type_id,new:t.jobTypeId}),r}(m,p),originalTechnicians:j,newTechnicians:p.assignedUsers?.map(e=>e.userId)},request:e});let g=await _`SELECT * FROM jobs WHERE id = ${o}`,b=(0,i.zW)(g[0]);return b.scheduledDate=b.scheduledDate instanceof Date?new Date(b.scheduledDate.getTime()-6e4*b.scheduledDate.getTimezoneOffset()).toISOString().split("T")[0]:null,n.NextResponse.json(b)}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}s()}catch(e){s(e)}})},47392:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{P:()=>a});var n=r(71309),o=r(16910),i=e([o]);async function a(e){let t=e.cookies.get("token")?.value;if(!t){let r=e.headers.get("authorization");r&&r.startsWith("Bearer ")&&(t=r.substring(7))}if(!t)return{user:null,response:n.NextResponse.json({error:"Unauthorized"},{status:401})};try{let e=(0,o.WX)(t);if(!e)return{user:null,response:n.NextResponse.json({error:"Unauthorized"},{status:401})};let r=await (0,o.GA)(e.userId);if(!r)return{user:null,response:n.NextResponse.json({error:"Unauthorized"},{status:401})};return{user:r}}catch(e){return console.error("API authentication error:",e),{user:null,response:n.NextResponse.json({error:"Unauthorized"},{status:401})}}}o=(i.then?(await i)():i)[0],s()}catch(e){s(e)}})},31689:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{b:()=>i});var n=r(1035),o=e([n]);n=(o.then?(await o)():o)[0];let a=new Map;async function i(e){let{userId:t,action:r,targetType:s,targetId:o,details:i,request:l}=e;try{let e=`${t||"system"}-${r}-${s||"none"}-${o||"none"}-${JSON.stringify(i||{})}`,u=Date.now(),d=a.get(e);if(d&&u-d<5e3)return;if(a.set(e,u),a.size>100)for(let[e,t]of a.entries())u-t>5e3&&a.delete(e);let c=(0,n.JF)(),p=null,_=null;l&&(p=l.ip||l.headers.get("x-forwarded-for")||l.headers.get("x-real-ip"),_=l.headers.get("user-agent")),await c`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address, user_agent)
      VALUES (
        ${t},
        ${r},
        ${s||null},
        ${o||null},
        ${i?JSON.stringify(i):null},
        ${p},
        ${_}
      );
    `}catch(e){console.error("Failed to log audit event:",e)}}s()}catch(e){s(e)}})},16910:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{CX:()=>f,Fs:()=>h,GA:()=>_,Gv:()=>d,RA:()=>c,WX:()=>p,c_:()=>u});var n=r(93981),o=r(67390),i=r.n(o),a=r(1035),l=e([a]);a=(l.then?(await l)():l)[0];let m=process.env.JWT_SECRET||"your-secret-key-change-in-production";async function u(e){return n.ZP.hash(e,12)}async function d(e,t){console.log("[Auth Debug] Verifying password...");let r=await n.ZP.compare(e,t);return console.log(`[Auth Debug] Password verification result: ${r}`),r}function c(e){console.log(`[Auth Debug] Generating token for userId: ${e}`);let t=i().sign({userId:e},m,{expiresIn:"7d"});return console.log(`[Auth Debug] Token generated (first 10 chars): ${t.substring(0,10)}...`),t}function p(e){try{return i().verify(e,m)}catch{return null}}async function _(e){try{let t=await (0,a.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${e} AND u.status = 'active'
    `;if(0===t.length)return null;let r=(0,a.zW)(t[0]);return r.roleName&&(r.role={id:r.roleId,name:r.roleName,description:r.roleDescription,isAdmin:r.roleIsAdmin,permissions:"string"==typeof r.rolePermissions?JSON.parse(r.rolePermissions):r.rolePermissions}),r}catch(e){return console.error("Error getting user by ID:",e),null}}async function f(e){try{console.log(`[Auth Debug] Attempting to get user by email: ${e}`);let t=await (0,a.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${e}
    `;if(0===t.length)return console.log(`[Auth Debug] User with email ${e} not found.`),null;let r=(0,a.zW)(t[0]);return console.log(`[Auth Debug] User found: ${r.email}, Status: ${r.status}`),r.roleName&&(r.role={id:r.roleId,name:r.roleName,description:r.roleDescription,isAdmin:r.roleIsAdmin,permissions:r.rolePermissions}),r}catch(e){return console.error("Error getting user by email:",e),null}}function h(e,t){if(!e.role||!e.role.permissions)return!1;if(!0===e.role.permissions.all)return!0;let r=t.split(":"),s=e.role.permissions;for(let e=0;e<r.length;e++){let t=r[e],n=r.slice(e).join(":");if(!0===s[n])return!0;if(void 0===s[t])break;if("boolean"==typeof s[t])return s[t];s=s[t]}return!1}s()}catch(e){s(e)}})},1035:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{JF:()=>a,_B:()=>d,zW:()=>function e(t){if(null==t)return t;if(Array.isArray(t))return t.map(e);if("object"!=typeof t||t instanceof Date)return t;let r={};for(let[s,n]of Object.entries(t))r[s.replace(/_([a-z])/g,(e,t)=>t.toUpperCase())]=e(n);return r}});var n=r(53524),o=r(23907),i=e([o]);o=(i.then?(await i)():i)[0];let u=globalThis,d=function(){if(!u.prisma){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required for PrismaClient");let e=new o.g({connectionString:process.env.DATABASE_URL});u.prisma=new n.PrismaClient({adapter:e})}return u.prisma}();function a(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required");return(e,...t)=>d.$queryRaw(e,...t)}function l(e){if(null==e)return e;if(Array.isArray(e))return e.map(l);if("object"!=typeof e)return e;let t={};for(let[r,s]of Object.entries(e))t[r.replace(/[A-Z]/g,e=>`_${e.toLowerCase()}`)]=l(s);return t}s()}catch(e){s(e)}})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[9379,4739,1309,3981,7390,3389],()=>r(85663));module.exports=s})();