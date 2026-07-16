"use strict";(()=>{var e={};e.id=6707,e.ids=[6707],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},76162:e=>{e.exports=require("stream")},21764:e=>{e.exports=require("util")},8678:e=>{e.exports=import("pg")},46174:(e,r,t)=>{t.a(e,async(e,n)=>{try{t.r(r),t.d(r,{originalPathname:()=>g,patchFetch:()=>c,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>p});var s=t(73278),a=t(45002),o=t(54877),i=t(64538),u=e([i]);i=(u.then?(await u)():u)[0];let l=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/maintenance/occurrences/[id]/route",pathname:"/api/maintenance/occurrences/[id]",filename:"route",bundlePath:"app/api/maintenance/occurrences/[id]/route"},resolvedPagePath:"C:\\Users\\ADMIN\\Desktop\\code\\Rotex\\solar-ops\\app\\api\\maintenance\\occurrences\\[id]\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:m}=l,g="/api/maintenance/occurrences/[id]/route";function c(){return(0,o.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:p})}n()}catch(e){n(e)}})},64538:(e,r,t)=>{t.a(e,async(e,n)=>{try{t.r(r),t.d(r,{DELETE:()=>m,GET:()=>d,PUT:()=>p});var s=t(71309),a=t(93389),o=t(1035),i=t(47392),u=t(16910),c=t(31689),l=e([o,i,u,c]);[o,i,u,c]=l.then?(await l)():l;let g=a.Ry({status:a.Z_().optional(),assignedTo:a.Z_().optional().nullable(),priority:a.Z_().optional()});async function d(e,{params:r}){let{user:t,response:n}=await (0,i.P)(e);if(n)return n;if(!t||!(0,u.Fs)(t,"maintenance:read"))return s.NextResponse.json({error:"Forbidden"},{status:403});try{let e=(0,o.JF)(),[t]=await e`
      SELECT * FROM maintenance_occurrences WHERE id = ${r.id}
    `;if(!t)return s.NextResponse.json({error:"Occurrence not found"},{status:404});return s.NextResponse.json((0,o.zW)(t))}catch(e){return s.NextResponse.json({error:"Internal server error"},{status:500})}}async function p(e,{params:r}){let{user:t,response:n}=await (0,i.P)(e);if(n)return n;let a=(0,u.Fs)(t,"maintenance:update");try{let n=await e.json(),i=g.safeParse(n);if(!i.success)return s.NextResponse.json({error:i.error.errors},{status:400});let u=i.data,l=(0,o.JF)(),[d]=await l`
      SELECT assigned_to, status, scheduled_date FROM maintenance_occurrences WHERE id = ${r.id}
    `;if(!d)return s.NextResponse.json({error:"Occurrence not found"},{status:404});if(!a){if(d.assigned_to!==t.id)return s.NextResponse.json({error:"Forbidden: You are not assigned to this task"},{status:403});let e=new Date,r=new Date(d.scheduled_date);if(r.getMonth()!==e.getMonth()||r.getFullYear()!==e.getFullYear())return s.NextResponse.json({error:"Forbidden: You can only complete tasks scheduled for the current month"},{status:403});if(Object.keys(u).length>1||!u.status||"completed"!==u.status)return s.NextResponse.json({error:"Forbidden: You can only mark tasks as completed"},{status:403})}let[p]=await l`
      UPDATE maintenance_occurrences
      SET
        status = ${u.status||d.status},
        assigned_to = ${a&&u.assignedTo||d.assigned_to},
        priority = ${a&&u.priority||"medium"},
        completed_at = ${"completed"===u.status?new Date:null}
      WHERE id = ${r.id}
      RETURNING *
    `,m=d.status,_=p.status;if("completed"===_&&"completed"!==m){let[n]=await l`
        SELECT mt.job_value 
        FROM maintenance_templates mt
        JOIN maintenance_occurrences mo ON mo.template_id = mt.id
        WHERE mo.id = ${r.id}
      `;if(n&&n.job_value>0){let e=new Date,[r]=await l`SELECT id FROM accrued_values WHERE maintenance_occurrence_id = ${p.id}`,t=n.job_value;r?await l`
            UPDATE accrued_values
            SET 
              job_value = ${n.job_value},
              earned_amount = ${t},
              user_id = ${p.assigned_to},
              month = ${e.getMonth()+1},
              year = ${e.getFullYear()}
            WHERE id = ${r.id};
          `:await l`
            INSERT INTO accrued_values (user_id, maintenance_occurrence_id, job_value, earned_amount, month, year, created_at)
            VALUES (
              ${p.assigned_to},
              ${p.id},
              ${n.job_value},
              ${t},
              ${e.getMonth()+1},
              ${e.getFullYear()},
              ${e}
            );
          `}await (0,c.b)({userId:t.id,action:"maintenance_occurrence_completed",targetType:"maintenance_occurrence",targetId:r.id,details:{status:_,previousStatus:m,assignedTo:p.assigned_to},request:e})}else"completed"!==_&&"completed"===m?(await l`
        DELETE FROM accrued_values WHERE maintenance_occurrence_id = ${r.id}
      `,await (0,c.b)({userId:t.id,action:"maintenance_occurrence_status_changed",targetType:"maintenance_occurrence",targetId:r.id,details:{status:_,previousStatus:m,assignedTo:p.assigned_to},request:e})):_!==m&&await (0,c.b)({userId:t.id,action:"maintenance_occurrence_status_changed",targetType:"maintenance_occurrence",targetId:r.id,details:{status:_,previousStatus:m,assignedTo:p.assigned_to},request:e});return s.NextResponse.json((0,o.zW)(p))}catch(e){return s.NextResponse.json({error:"Internal server error"},{status:500})}}async function m(e,{params:r}){let{user:t,response:n}=await (0,i.P)(e);if(n)return n;if(!t||!(0,u.Fs)(t,"maintenance:delete"))return s.NextResponse.json({error:"Forbidden"},{status:403});try{let e=(0,o.JF)();await e`
      DELETE FROM accrued_values WHERE maintenance_occurrence_id = ${r.id}
    `;let t=await o._B.$executeRaw`
      DELETE FROM maintenance_occurrences WHERE id = ${r.id}
    `;if(0===t)return s.NextResponse.json({error:"Occurrence not found"},{status:404});return s.NextResponse.json({message:"Maintenance occurrence deleted successfully"})}catch(e){return s.NextResponse.json({error:"Internal server error"},{status:500})}}n()}catch(e){n(e)}})},47392:(e,r,t)=>{t.a(e,async(e,n)=>{try{t.d(r,{P:()=>i});var s=t(71309),a=t(16910),o=e([a]);async function i(e){let r=e.cookies.get("token")?.value;if(!r){let t=e.headers.get("authorization");t&&t.startsWith("Bearer ")&&(r=t.substring(7))}if(!r)return{user:null,response:s.NextResponse.json({error:"Unauthorized"},{status:401})};try{let e=(0,a.WX)(r);if(!e)return{user:null,response:s.NextResponse.json({error:"Unauthorized"},{status:401})};let t=await (0,a.GA)(e.userId);if(!t)return{user:null,response:s.NextResponse.json({error:"Unauthorized"},{status:401})};return{user:t}}catch(e){return console.error("API authentication error:",e),{user:null,response:s.NextResponse.json({error:"Unauthorized"},{status:401})}}}a=(o.then?(await o)():o)[0],n()}catch(e){n(e)}})},31689:(e,r,t)=>{t.a(e,async(e,n)=>{try{t.d(r,{b:()=>o});var s=t(1035),a=e([s]);s=(a.then?(await a)():a)[0];let i=new Map;async function o(e){let{userId:r,action:t,targetType:n,targetId:a,details:o,request:u}=e;try{let e=`${r||"system"}-${t}-${n||"none"}-${a||"none"}-${JSON.stringify(o||{})}`,c=Date.now(),l=i.get(e);if(l&&c-l<5e3)return;if(i.set(e,c),i.size>100)for(let[e,r]of i.entries())c-r>5e3&&i.delete(e);let d=(0,s.JF)(),p=null,m=null;u&&(p=u.ip||u.headers.get("x-forwarded-for")||u.headers.get("x-real-ip"),m=u.headers.get("user-agent")),await d`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address, user_agent)
      VALUES (
        ${r},
        ${t},
        ${n||null},
        ${a||null},
        ${o?JSON.stringify(o):null},
        ${p},
        ${m}
      );
    `}catch(e){console.error("Failed to log audit event:",e)}}n()}catch(e){n(e)}})},16910:(e,r,t)=>{t.a(e,async(e,n)=>{try{t.d(r,{CX:()=>g,Fs:()=>_,GA:()=>m,Gv:()=>l,RA:()=>d,WX:()=>p,c_:()=>c});var s=t(93981),a=t(67390),o=t.n(a),i=t(1035),u=e([i]);i=(u.then?(await u)():u)[0];let f=process.env.JWT_SECRET||"your-secret-key-change-in-production";async function c(e){return s.ZP.hash(e,12)}async function l(e,r){console.log("[Auth Debug] Verifying password...");let t=await s.ZP.compare(e,r);return console.log(`[Auth Debug] Password verification result: ${t}`),t}function d(e){console.log(`[Auth Debug] Generating token for userId: ${e}`);let r=o().sign({userId:e},f,{expiresIn:"7d"});return console.log(`[Auth Debug] Token generated (first 10 chars): ${r.substring(0,10)}...`),r}function p(e){try{return o().verify(e,f)}catch{return null}}async function m(e){try{let r=await (0,i.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${e} AND u.status = 'active'
    `;if(0===r.length)return null;let t=(0,i.zW)(r[0]);return t.roleName&&(t.role={id:t.roleId,name:t.roleName,description:t.roleDescription,isAdmin:t.roleIsAdmin,permissions:"string"==typeof t.rolePermissions?JSON.parse(t.rolePermissions):t.rolePermissions}),t}catch(e){return console.error("Error getting user by ID:",e),null}}async function g(e){try{console.log(`[Auth Debug] Attempting to get user by email: ${e}`);let r=await (0,i.JF)()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${e}
    `;if(0===r.length)return console.log(`[Auth Debug] User with email ${e} not found.`),null;let t=(0,i.zW)(r[0]);return console.log(`[Auth Debug] User found: ${t.email}, Status: ${t.status}`),t.roleName&&(t.role={id:t.roleId,name:t.roleName,description:t.roleDescription,isAdmin:t.roleIsAdmin,permissions:t.rolePermissions}),t}catch(e){return console.error("Error getting user by email:",e),null}}function _(e,r){if(!e.role||!e.role.permissions)return!1;if(!0===e.role.permissions.all)return!0;let t=r.split(":"),n=e.role.permissions;for(let e=0;e<t.length;e++){let r=t[e],s=t.slice(e).join(":");if(!0===n[s])return!0;if(void 0===n[r])break;if("boolean"==typeof n[r])return n[r];n=n[r]}return!1}n()}catch(e){n(e)}})},1035:(e,r,t)=>{t.a(e,async(e,n)=>{try{t.d(r,{JF:()=>i,_B:()=>l,zW:()=>function e(r){if(null==r)return r;if(Array.isArray(r))return r.map(e);if("object"!=typeof r||r instanceof Date)return r;let t={};for(let[n,s]of Object.entries(r))t[n.replace(/_([a-z])/g,(e,r)=>r.toUpperCase())]=e(s);return t}});var s=t(53524),a=t(23907),o=e([a]);a=(o.then?(await o)():o)[0];let c=globalThis,l=function(){if(!c.prisma){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required for PrismaClient");let e=new a.g({connectionString:process.env.DATABASE_URL});c.prisma=new s.PrismaClient({adapter:e})}return c.prisma}();function i(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required");return(e,...r)=>l.$queryRaw(e,...r)}function u(e){if(null==e)return e;if(Array.isArray(e))return e.map(u);if("object"!=typeof e)return e;let r={};for(let[t,n]of Object.entries(e))r[t.replace(/[A-Z]/g,e=>`_${e.toLowerCase()}`)]=u(n);return r}n()}catch(e){n(e)}})}};var r=require("../../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),n=r.X(0,[9379,4739,1309,3981,7390,3389],()=>t(46174));module.exports=n})();