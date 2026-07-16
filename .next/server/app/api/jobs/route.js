"use strict";(()=>{var e={};e.id=4204,e.ids=[4204],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},98216:e=>{e.exports=require("net")},19801:e=>{e.exports=require("os")},76162:e=>{e.exports=require("stream")},82452:e=>{e.exports=require("tls")},74175:e=>{e.exports=require("tty")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},8678:e=>{e.exports=import("pg")},57127:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{originalPathname:()=>j,patchFetch:()=>c,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>_,staticGenerationAsyncStorage:()=>p});var i=r(73278),n=r(45002),o=r(54877),a=r(84052),l=e([a]);a=(l.then?(await l)():l)[0];let u=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/jobs/route",pathname:"/api/jobs",filename:"route",bundlePath:"app/api/jobs/route"},resolvedPagePath:"C:\\Users\\ADMIN\\Desktop\\code\\Rotex\\solar-ops\\app\\api\\jobs\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:_}=u,j="/api/jobs/route";function c(){return(0,o.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:p})}s()}catch(e){s(e)}})},84052:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{GET:()=>p,POST:()=>_});var i=r(71309),n=r(93389),o=r(1035),a=r(47392),l=r(16910),c=r(57143),u=r(31689),d=e([o,a,l,u]);[o,a,l,u]=d.then?(await d)():d;let j=n.Ry({title:n.Z_().min(1),description:n.Z_().optional(),jobTypeId:n.Z_().min(1),priority:n.Z_().optional(),locationAddress:n.Z_().min(1),locationLat:n.Z_().optional(),locationLng:n.Z_().optional(),scheduledDate:n.Z_().optional(),scheduledTime:n.Z_().optional(),jobValue:n.Rx().optional(),instructions:n.Z_().optional(),assignedUsers:n.IX(n.Ry({userId:n.Z_(),role:n.Z_()})).optional()});async function p(e){try{let t,r;let{user:s,response:n}=await (0,a.P)(e);if(n)return n;if(!s||!(0,l.Fs)(s,"jobs:read"))return i.NextResponse.json({error:"Forbidden"},{status:403});let c=(0,o.JF)(),{searchParams:u}=e.nextUrl,d=parseInt(u.get("page")||"1",10),p=parseInt(u.get("limit")||"10",10),_=(d-1)*p;(0,l.Fs)(s,"jobs:read:all")?(t=await c`
        SELECT 
          j.*,
          jt.name as job_type_name, jt.color as job_type_color,
          cu.first_name as created_first_name, cu.last_name as created_last_name
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        LEFT JOIN users cu ON j.created_by = cu.id
        WHERE j.is_archived = FALSE
        ORDER BY j.created_at DESC
        LIMIT ${p}
        OFFSET ${_}
      `,[{count:r}]=await c`
        SELECT COUNT(*) as count
        FROM jobs j
        WHERE j.is_archived = FALSE
      `):(0,l.Fs)(s,"jobs:read:team")?(t=await c`
        SELECT 
          j.*,
          jt.name as job_type_name, jt.color as job_type_color,
          cu.first_name as created_first_name, cu.last_name as created_last_name
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        LEFT JOIN users cu ON j.created_by = cu.id
        JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id IN (
          SELECT technician_id FROM supervisor_technicians WHERE supervisor_id = ${s.id}
        )
        AND j.is_archived = FALSE
        ORDER BY j.created_at DESC
        LIMIT ${p}
        OFFSET ${_}
      `,[{count:r}]=await c`
        SELECT COUNT(DISTINCT j.id)
        FROM jobs j
        JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id IN (
          SELECT technician_id FROM supervisor_technicians WHERE supervisor_id = ${s.id}
        )
        AND j.is_archived = FALSE
      `):(t=await c`
        SELECT 
          j.*,
          jt.name as job_type_name, jt.color as job_type_color,
          cu.first_name as created_first_name, cu.last_name as created_last_name
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        LEFT JOIN users cu ON j.created_by = cu.id
        JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id = ${s.id}
        AND j.is_archived = FALSE
        ORDER BY j.created_at DESC
        LIMIT ${p}
        OFFSET ${_}
      `,[{count:r}]=await c`
        SELECT COUNT(*) as count
        FROM jobs j
        JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id = ${s.id}
        AND j.is_archived = FALSE
      `);let j=(await Promise.all(t.map(async e=>{let t=(0,o.zW)(e),r=await c`
          SELECT
            jt.technician_id,
            jt.role,
            jt.completed_at,
            u.first_name,
            u.last_name
          FROM job_technicians jt
          JOIN users u ON jt.technician_id = u.id
          WHERE jt.job_id = ${t.id}
        `;return t.technicians=r.map(e=>({technicianId:e.technician_id,role:e.role,completedAt:e.completed_at,firstName:e.first_name,lastName:e.last_name})),t.jobTypeName&&(t.jobType={id:t.jobTypeId,name:t.jobTypeName,color:t.jobTypeColor}),t.createdFirstName&&(t.createdUser={id:t.createdBy,firstName:t.createdFirstName,lastName:t.createdLastName}),delete t.jobTypeName,delete t.jobTypeColor,delete t.assignedFirstName,delete t.assignedLastName,delete t.createdFirstName,delete t.createdLastName,t}))).map(e=>({...e,scheduledDate:e.scheduledDate instanceof Date?new Date(e.scheduledDate.getTime()-6e4*e.scheduledDate.getTimezoneOffset()).toISOString().split("T")[0]:null,scheduledTime:e.scheduledTime||null}));return i.NextResponse.json({jobs:j,total:parseInt(r,10),page:d,limit:p})}catch(e){return i.NextResponse.json({error:"Internal server error"},{status:500})}}async function _(e){try{let{user:t,response:r}=await (0,a.P)(e);if(r)return r;if(!t||!(0,l.Fs)(t,"jobs:create"))return i.NextResponse.json({error:"Forbidden"},{status:403});let s=await e.json(),n=j.safeParse(s);if(!n.success)return i.NextResponse.json({error:n.error.format()},{status:400});let d=n.data,p=(0,o.JF)(),_=(await p`
      INSERT INTO jobs (
        title, description, job_type_id, created_by,
        priority, location_address, location_lat, location_lng,
        scheduled_date, scheduled_time, job_value,
        instructions, status
      ) VALUES (
        ${d.title},
        ${d.description||null},
        ${d.jobTypeId},
        ${t.id},
        ${d.priority||"medium"},
        ${d.locationAddress},
        ${d.locationLat||null},
        ${d.locationLng||null},
        ${d.scheduledDate||null},
        ${d.scheduledTime||null},
        ${d.jobValue||0},
        ${d.instructions||null},
        'assigned'
      ) RETURNING id
    `)[0].id;if(d.assignedUsers&&d.assignedUsers.length>0)for(let e of d.assignedUsers)await p`
          INSERT INTO job_technicians (job_id, technician_id, role)
          VALUES (${_}, ${e.userId}, ${e.role})
        `,await p`
          INSERT INTO notifications (recipient_id, sender_id, title, message, type, related_job_id)
          VALUES (
            ${e.userId},
            ${t.id},
            'New Job Assignment',
            ${`You have been assigned a new job: ${d.title}`},
            'job_assignment',
            ${_}
          )
        `;if(d.assignedUsers&&d.assignedUsers.length>0)for(let e of d.assignedUsers){let t=await p`
          SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ${e.userId}
        `,r={title:"New Job Assignment",body:`You have been assigned a new job: ${d.title}`};for(let e of t){let t={endpoint:e.endpoint,keys:{p256dh:e.p256dh_key,auth:e.auth_key}};await (0,c.z)(t,r)}}return await (0,u.b)({userId:t.id,action:"job_create",targetType:"job",targetId:_,details:{title:d.title,assignedTechnicians:d.assignedUsers?.map(e=>e.userId)},request:e}),i.NextResponse.json({id:_,message:"Job created successfully"})}catch(e){return console.error("POST /api/jobs error:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}s()}catch(e){s(e)}})},47392:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{P:()=>a});var i=r(71309),n=r(16910),o=e([n]);async function a(e){let t=e.cookies.get("token")?.value;if(!t){let r=e.headers.get("authorization");r&&r.startsWith("Bearer ")&&(t=r.substring(7))}if(!t)return{user:null,response:i.NextResponse.json({error:"Unauthorized"},{status:401})};try{let e=(0,n.WX)(t);if(!e)return{user:null,response:i.NextResponse.json({error:"Unauthorized"},{status:401})};let r=await (0,n.GA)(e.userId);if(!r)return{user:null,response:i.NextResponse.json({error:"Unauthorized"},{status:401})};return{user:r}}catch(e){return console.error("API authentication error:",e),{user:null,response:i.NextResponse.json({error:"Unauthorized"},{status:401})}}}n=(o.then?(await o)():o)[0],s()}catch(e){s(e)}})},31689:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{b:()=>o});var i=r(1035),n=e([i]);i=(n.then?(await n)():n)[0];let a=new Map;async function o(e){let{userId:t,action:r,targetType:s,targetId:n,details:o,request:l}=e;try{let e=`${t||"system"}-${r}-${s||"none"}-${n||"none"}-${JSON.stringify(o||{})}`,c=Date.now(),u=a.get(e);if(u&&c-u<5e3)return;if(a.set(e,c),a.size>100)for(let[e,t]of a.entries())c-t>5e3&&a.delete(e);let d=(0,i.JF)(),p=null,_=null;l&&(p=l.ip||l.headers.get("x-forwarded-for")||l.headers.get("x-real-ip"),_=l.headers.get("user-agent")),await d`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address, user_agent)
      VALUES (
        ${t},
        ${r},
        ${s||null},
        ${n||null},
        ${o?JSON.stringify(o):null},
        ${p},
        ${_}
      );
    `}catch(e){console.error("Failed to log audit event:",e)}}s()}catch(e){s(e)}})},16910:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{CX:()=>j,Fs:()=>m,GA:()=>_,Gv:()=>u,RA:()=>d,WX:()=>p,c_:()=>c});var i=r(93981),n=r(67390),o=r.n(n),a=r(1035),l=e([a]);a=(l.then?(await l)():l)[0];let h=process.env.JWT_SECRET||"your-secret-key-change-in-production";async function c(e){return i.ZP.hash(e,12)}async function u(e,t){console.log("[Auth Debug] Verifying password...");let r=await i.ZP.compare(e,t);return console.log(`[Auth Debug] Password verification result: ${r}`),r}function d(e){console.log(`[Auth Debug] Generating token for userId: ${e}`);let t=o().sign({userId:e},h,{expiresIn:"7d"});return console.log(`[Auth Debug] Token generated (first 10 chars): ${t.substring(0,10)}...`),t}function p(e){try{return o().verify(e,h)}catch{return null}}async function _(e){try{let t=await (0,a.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${e} AND u.status = 'active'
    `;if(0===t.length)return null;let r=(0,a.zW)(t[0]);return r.roleName&&(r.role={id:r.roleId,name:r.roleName,description:r.roleDescription,isAdmin:r.roleIsAdmin,permissions:"string"==typeof r.rolePermissions?JSON.parse(r.rolePermissions):r.rolePermissions}),r}catch(e){return console.error("Error getting user by ID:",e),null}}async function j(e){try{console.log(`[Auth Debug] Attempting to get user by email: ${e}`);let t=await (0,a.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${e}
    `;if(0===t.length)return console.log(`[Auth Debug] User with email ${e} not found.`),null;let r=(0,a.zW)(t[0]);return console.log(`[Auth Debug] User found: ${r.email}, Status: ${r.status}`),r.roleName&&(r.role={id:r.roleId,name:r.roleName,description:r.roleDescription,isAdmin:r.roleIsAdmin,permissions:r.rolePermissions}),r}catch(e){return console.error("Error getting user by email:",e),null}}function m(e,t){if(!e.role||!e.role.permissions)return!1;if(!0===e.role.permissions.all)return!0;let r=t.split(":"),s=e.role.permissions;for(let e=0;e<r.length;e++){let t=r[e],i=r.slice(e).join(":");if(!0===s[i])return!0;if(void 0===s[t])break;if("boolean"==typeof s[t])return s[t];s=s[t]}return!1}s()}catch(e){s(e)}})},1035:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{JF:()=>a,_B:()=>u,zW:()=>function e(t){if(null==t)return t;if(Array.isArray(t))return t.map(e);if("object"!=typeof t||t instanceof Date)return t;let r={};for(let[s,i]of Object.entries(t))r[s.replace(/_([a-z])/g,(e,t)=>t.toUpperCase())]=e(i);return r}});var i=r(53524),n=r(23907),o=e([n]);n=(o.then?(await o)():o)[0];let c=globalThis,u=function(){if(!c.prisma){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required for PrismaClient");let e=new n.g({connectionString:process.env.DATABASE_URL});c.prisma=new i.PrismaClient({adapter:e})}return c.prisma}();function a(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required");return(e,...t)=>u.$queryRaw(e,...t)}function l(e){if(null==e)return e;if(Array.isArray(e))return e.map(l);if("object"!=typeof e)return e;let t={};for(let[r,s]of Object.entries(e))t[r.replace(/[A-Z]/g,e=>`_${e.toLowerCase()}`)]=l(s);return t}s()}catch(e){s(e)}})},57143:(e,t,r)=>{r.d(t,{z:()=>n});var s=r(81417),i=r.n(s);async function n(e,t){if(!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY){console.error("Cannot send push notification because VAPID keys are not set.");return}try{await i().sendNotification(e,JSON.stringify(t)),console.log("Push notification sent successfully.")}catch(e){console.error("Error sending push notification:",e)}}process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY?i().setVapidDetails("mailto:oluwarotimiadewumi@gmail.com",process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY):console.warn("VAPID keys are not set. Push notifications will not work.")}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[9379,4739,1309,3981,7390,3389,1417],()=>r(57127));module.exports=s})();