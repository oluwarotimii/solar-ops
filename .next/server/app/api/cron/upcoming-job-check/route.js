"use strict";(()=>{var e={};e.id=4229,e.ids=[4229],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},33569:(e,t,r)=>{r.a(e,async(e,i)=>{try{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>d,requestAsyncStorage:()=>u,routeModule:()=>l,serverHooks:()=>h,staticGenerationAsyncStorage:()=>p});var o=r(73278),n=r(45002),a=r(54877),s=r(20186),c=e([s]);s=(c.then?(await c)():c)[0];let l=new o.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/cron/upcoming-job-check/route",pathname:"/api/cron/upcoming-job-check",filename:"route",bundlePath:"app/api/cron/upcoming-job-check/route"},resolvedPagePath:"C:\\Users\\ADMIN\\Desktop\\code\\Rotex\\solar-ops\\app\\api\\cron\\upcoming-job-check\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:u,staticGenerationAsyncStorage:p,serverHooks:h}=l,f="/api/cron/upcoming-job-check/route";function d(){return(0,a.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:p})}i()}catch(e){i(e)}})},20186:(e,t,r)=>{r.a(e,async(e,i)=>{try{r.r(t),r.d(t,{GET:()=>s,dynamic:()=>c});var o=r(71309),n=r(1035),a=e([n]);n=(a.then?(await a)():a)[0];let c="force-dynamic";async function s(e){try{let t=e.headers.get("authorization");if(!process.env.CRON_SECRET||t!==`Bearer ${process.env.CRON_SECRET}`)return o.NextResponse.json({error:"Unauthorized"},{status:401});let r=(0,n.JF)(),i=new Date,a=0,s=await r`
      SELECT id, title, scheduled_date FROM jobs
      WHERE scheduled_date < ${i.toISOString().split("T")[0]}
      AND status NOT IN ('completed', 'cancelled')
    `;if(s.length>0){let e=await r`
        SELECT u.id FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.is_admin = TRUE
      `;for(let t of s)for(let i of e)await r`
            INSERT INTO notifications (recipient_id, title, message, type, related_job_id)
            VALUES (${i.id}, 'Overdue Job Alert', ${`Job "${t.title}" was scheduled for ${new Date(t.scheduled_date).toLocaleDateString("en-NG")} and is not completed.`}, 'overdue_job_alert', ${t.id})
          `,a++}let c=i.toISOString().split("T")[0],d=new Date(i.getTime()+36e5),l=await r`
      SELECT id, title, scheduled_date, scheduled_time FROM jobs
      WHERE scheduled_date = ${c}
      AND status NOT IN ('completed', 'cancelled')
    `;for(let e of l){let t=await r`
        SELECT technician_id FROM job_technicians WHERE job_id = ${e.id}
      `;for(let i of t)await r`
          INSERT INTO notifications (recipient_id, title, message, type, related_job_id)
          VALUES (${i.technician_id}, 'Job Reminder', ${`Job "${e.title}" is scheduled for today.`}, 'job_reminder', ${e.id})
          ON CONFLICT (recipient_id, related_job_id, type) DO NOTHING;
        `,a++;if(e.scheduled_time){let o=new Date(`${e.scheduled_date}T${e.scheduled_time}`);if(o>i&&o<=d)for(let i of t)await r`
              INSERT INTO notifications (recipient_id, title, message, type, related_job_id)
              VALUES (${i.technician_id}, 'Job Starting Soon', ${`Job "${e.title}" is scheduled to start in about an hour.`}, 'job_reminder_hourly', ${e.id})
              ON CONFLICT (recipient_id, related_job_id, type) DO NOTHING;
            `,a++}}return o.NextResponse.json({message:"Cron job for reminders and overdue checks completed successfully.",overdueJobsChecked:s.length,upcomingJobsChecked:l.length,notificationsSent:a})}catch(e){return o.NextResponse.json({error:"Internal server error"},{status:500})}}i()}catch(e){i(e)}})},1035:(e,t,r)=>{r.a(e,async(e,i)=>{try{r.d(t,{JF:()=>s,_B:()=>l,zW:()=>function e(t){if(null==t)return t;if(Array.isArray(t))return t.map(e);if("object"!=typeof t||t instanceof Date)return t;let r={};for(let[i,o]of Object.entries(t))r[i.replace(/_([a-z])/g,(e,t)=>t.toUpperCase())]=e(o);return r}});var o=r(53524),n=r(23907),a=e([n]);n=(a.then?(await a)():a)[0];let d=globalThis,l=function(){if(!d.prisma){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required for PrismaClient");let e=new n.g({connectionString:process.env.DATABASE_URL});d.prisma=new o.PrismaClient({adapter:e})}return d.prisma}();function s(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required");return(e,...t)=>l.$queryRaw(e,...t)}function c(e){if(null==e)return e;if(Array.isArray(e))return e.map(c);if("object"!=typeof e)return e;let t={};for(let[r,i]of Object.entries(e))t[r.replace(/[A-Z]/g,e=>`_${e.toLowerCase()}`)]=c(i);return t}i()}catch(e){i(e)}})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[9379,4739,1309],()=>r(33569));module.exports=i})();