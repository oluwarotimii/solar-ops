"use strict";(()=>{var e={};e.id=4610,e.ids=[4610],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},76162:e=>{e.exports=require("stream")},21764:e=>{e.exports=require("util")},8678:e=>{e.exports=import("pg")},91363:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.r(r),t.d(r,{originalPathname:()=>f,patchFetch:()=>l,requestAsyncStorage:()=>d,routeModule:()=>c,serverHooks:()=>m,staticGenerationAsyncStorage:()=>p});var n=t(73278),a=t(45002),o=t(54877),i=t(59639),u=e([i]);i=(u.then?(await u)():u)[0];let c=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/jobs/archived/route",pathname:"/api/jobs/archived",filename:"route",bundlePath:"app/api/jobs/archived/route"},resolvedPagePath:"C:\\Users\\ADMIN\\Desktop\\code\\Rotex\\solar-ops\\app\\api\\jobs\\archived\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:m}=c,f="/api/jobs/archived/route";function l(){return(0,o.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:p})}s()}catch(e){s(e)}})},59639:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.r(r),t.d(r,{GET:()=>c,POST:()=>d});var n=t(71309),a=t(93389),o=t(1035),i=t(47392),u=t(16910),l=e([o,i,u]);[o,i,u]=l.then?(await l)():l;let p=a.Ry({jobId:a.Z_().min(1)});async function c(e){try{let{user:r,response:t}=await (0,i.P)(e);if(t)return t;if(!r||!(0,u.Fs)(r,"jobs:read"))return n.NextResponse.json({error:"Forbidden"},{status:403});let s=(0,o.JF)(),{searchParams:a}=e.nextUrl,l=parseInt(a.get("page")||"1",10),c=parseInt(a.get("limit")||"12",10),d=(l-1)*c,p=await s`
      SELECT 
        j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      WHERE j.is_archived = TRUE AND j.status = 'completed'
      ORDER BY j.archived_at DESC
      LIMIT ${c}
      OFFSET ${d}
    `,[{count:m}]=await s`
      SELECT COUNT(*) as count
      FROM jobs j
      WHERE j.is_archived = TRUE AND j.status = 'completed'
    `,f=(await Promise.all(p.map(async e=>{let r=(0,o.zW)(e),t=await s`
          SELECT
            jt.technician_id,
            jt.role,
            jt.completed_at,
            u.first_name,
            u.last_name
          FROM job_technicians jt
          JOIN users u ON jt.technician_id = u.id
          WHERE jt.job_id = ${r.id}
        `;return r.technicians=t.map(e=>({technicianId:e.technician_id,role:e.role,completedAt:e.completed_at,firstName:e.first_name,lastName:e.last_name})),r.jobTypeName&&(r.jobType={id:r.jobTypeId,name:r.jobTypeName,color:r.jobTypeColor}),r.createdFirstName&&(r.createdUser={id:r.createdBy,firstName:r.createdFirstName,lastName:r.createdLastName}),delete r.jobTypeName,delete r.jobTypeColor,delete r.assignedFirstName,delete r.assignedLastName,delete r.createdFirstName,delete r.createdLastName,r}))).map(e=>({...e,scheduledDate:e.scheduledDate instanceof Date?new Date(e.scheduledDate.getTime()-6e4*e.scheduledDate.getTimezoneOffset()).toISOString().split("T")[0]:null,scheduledTime:e.scheduledTime||null}));return n.NextResponse.json({jobs:f,total:parseInt(m,10),page:l,limit:c})}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}async function d(e){try{let{user:r,response:t}=await (0,i.P)(e);if(t)return t;if(!r||!(0,u.Fs)(r,"jobs:update"))return n.NextResponse.json({error:"Forbidden"},{status:403});let s=await e.json(),a=p.safeParse(s);if(!a.success)return n.NextResponse.json({error:a.error.format()},{status:400});let{jobId:l}=a.data,c=(0,o.JF)(),[d]=await c`
      SELECT id, is_archived FROM jobs WHERE id = ${l}
    `;if(!d)return n.NextResponse.json({error:"Job not found"},{status:404});if(!d.is_archived)return n.NextResponse.json({error:"Job is not archived"},{status:400});let[m]=await c`
      UPDATE jobs 
      SET status = 'assigned', 
          completed_at = NULL,
          is_archived = FALSE,
          archived_at = NULL
      WHERE id = ${l}
      RETURNING id, status, is_archived
    `;return await c`
      UPDATE job_technicians 
      SET completed_at = NULL 
      WHERE job_id = ${l}
    `,await c`
      DELETE FROM accrued_values 
      WHERE job_id = ${l}
    `,n.NextResponse.json({message:"Job reopened and unarchived successfully",job:m})}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}s()}catch(e){s(e)}})},47392:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{P:()=>i});var n=t(71309),a=t(16910),o=e([a]);async function i(e){let r=e.cookies.get("token")?.value;if(!r){let t=e.headers.get("authorization");t&&t.startsWith("Bearer ")&&(r=t.substring(7))}if(!r)return{user:null,response:n.NextResponse.json({error:"Unauthorized"},{status:401})};try{let e=(0,a.WX)(r);if(!e)return{user:null,response:n.NextResponse.json({error:"Unauthorized"},{status:401})};let t=await (0,a.GA)(e.userId);if(!t)return{user:null,response:n.NextResponse.json({error:"Unauthorized"},{status:401})};return{user:t}}catch(e){return console.error("API authentication error:",e),{user:null,response:n.NextResponse.json({error:"Unauthorized"},{status:401})}}}a=(o.then?(await o)():o)[0],s()}catch(e){s(e)}})},16910:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{CX:()=>f,Fs:()=>h,GA:()=>m,Gv:()=>c,RA:()=>d,WX:()=>p,c_:()=>l});var n=t(93981),a=t(67390),o=t.n(a),i=t(1035),u=e([i]);i=(u.then?(await u)():u)[0];let j=process.env.JWT_SECRET||"your-secret-key-change-in-production";async function l(e){return n.ZP.hash(e,12)}async function c(e,r){console.log("[Auth Debug] Verifying password...");let t=await n.ZP.compare(e,r);return console.log(`[Auth Debug] Password verification result: ${t}`),t}function d(e){console.log(`[Auth Debug] Generating token for userId: ${e}`);let r=o().sign({userId:e},j,{expiresIn:"7d"});return console.log(`[Auth Debug] Token generated (first 10 chars): ${r.substring(0,10)}...`),r}function p(e){try{return o().verify(e,j)}catch{return null}}async function m(e){try{let r=await (0,i.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${e} AND u.status = 'active'
    `;if(0===r.length)return null;let t=(0,i.zW)(r[0]);return t.roleName&&(t.role={id:t.roleId,name:t.roleName,description:t.roleDescription,isAdmin:t.roleIsAdmin,permissions:"string"==typeof t.rolePermissions?JSON.parse(t.rolePermissions):t.rolePermissions}),t}catch(e){return console.error("Error getting user by ID:",e),null}}async function f(e){try{console.log(`[Auth Debug] Attempting to get user by email: ${e}`);let r=await (0,i.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${e}
    `;if(0===r.length)return console.log(`[Auth Debug] User with email ${e} not found.`),null;let t=(0,i.zW)(r[0]);return console.log(`[Auth Debug] User found: ${t.email}, Status: ${t.status}`),t.roleName&&(t.role={id:t.roleId,name:t.roleName,description:t.roleDescription,isAdmin:t.roleIsAdmin,permissions:t.rolePermissions}),t}catch(e){return console.error("Error getting user by email:",e),null}}function h(e,r){if(!e.role||!e.role.permissions)return!1;if(!0===e.role.permissions.all)return!0;let t=r.split(":"),s=e.role.permissions;for(let e=0;e<t.length;e++){let r=t[e],n=t.slice(e).join(":");if(!0===s[n])return!0;if(void 0===s[r])break;if("boolean"==typeof s[r])return s[r];s=s[r]}return!1}s()}catch(e){s(e)}})},1035:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{JF:()=>i,_B:()=>c,zW:()=>function e(r){if(null==r)return r;if(Array.isArray(r))return r.map(e);if("object"!=typeof r||r instanceof Date)return r;let t={};for(let[s,n]of Object.entries(r))t[s.replace(/_([a-z])/g,(e,r)=>r.toUpperCase())]=e(n);return t}});var n=t(53524),a=t(23907),o=e([a]);a=(o.then?(await o)():o)[0];let l=globalThis,c=function(){if(!l.prisma){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required for PrismaClient");let e=new a.g({connectionString:process.env.DATABASE_URL});l.prisma=new n.PrismaClient({adapter:e})}return l.prisma}();function i(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required");return(e,...r)=>c.$queryRaw(e,...r)}function u(e){if(null==e)return e;if(Array.isArray(e))return e.map(u);if("object"!=typeof e)return e;let r={};for(let[t,s]of Object.entries(e))r[t.replace(/[A-Z]/g,e=>`_${e.toLowerCase()}`)]=u(s);return r}s()}catch(e){s(e)}})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[9379,4739,1309,3981,7390,3389],()=>t(91363));module.exports=s})();