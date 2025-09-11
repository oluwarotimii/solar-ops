import { getDbSql } from './db';

// Generate occurrences for the next 12 months by default
const OCCURRENCES_TO_GENERATE = 12;

export async function generateOccurrences(template) {
  console.log("[DEBUG] Template object received in generateOccurrences:", JSON.stringify(template, null, 2));
  const sql = getDbSql();
  const occurrences = [];
  const startDate = new Date();

  for (let i = 0; i < OCCURRENCES_TO_GENERATE; i++) {
    const scheduledDate = new Date(startDate);

    switch (template.recurrence_type) {
      case 'daily':
        scheduledDate.setDate(startDate.getDate() + i * template.recurrence_interval);
        break;
      case 'weekly':
        scheduledDate.setDate(startDate.getDate() + i * template.recurrence_interval * 7);
        break;
      case 'monthly':
        scheduledDate.setMonth(startDate.getMonth() + i * template.recurrence_interval);
        break;
      case 'yearly':
        scheduledDate.setFullYear(startDate.getFullYear() + i * template.recurrence_interval);
        break;
    }

    occurrences.push({
      templateId: template.id,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      assignedTo: template.assigned_to,
      status: 'scheduled',
      priority: 'medium',
    });
  }

  if (occurrences.length > 0) {
    // The @neondatabase/serverless driver does not support interactive transactions.
    // The most reliable way to insert multiple rows is to send all queries concurrently.
    const insertQueries = occurrences.map(o => sql`
      INSERT INTO maintenance_occurrences (template_id, scheduled_date, assigned_to, status, priority)
      VALUES (${o.templateId}, ${o.scheduledDate}, ${o.assignedTo}, ${o.status}, ${o.priority})
    `);
    
    await Promise.all(insertQueries);
  }
}