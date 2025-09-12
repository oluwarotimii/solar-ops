import { getDbSql } from './db';

// Generate occurrences for the next 12 months by default
const OCCURRENCES_TO_GENERATE = 12;

export async function generateOccurrences(template) {
  const sql = getDbSql();
  const occurrences = [];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Normalize start date

  for (let i = 0; i < OCCURRENCES_TO_GENERATE; i++) {
    const scheduledDate = new Date(startDate);

    switch (template.recurrence_type) {
      case 'daily':
        scheduledDate.setDate(startDate.getDate() + i * template.recurrence_interval);
        break;
      case 'weekly':
        // Start from the next occurrence of the specified day_of_week
        const currentDay = startDate.getDay();
        const desiredDay = template.day_of_week; // 0-6
        let dayDifference = desiredDay - currentDay;
        if (dayDifference < 0) {
          dayDifference += 7;
        }
        scheduledDate.setDate(startDate.getDate() + dayDifference + (i * template.recurrence_interval * 7));
        break;
      case 'monthly':
        // Set the month for the current iteration
        scheduledDate.setMonth(startDate.getMonth() + i * template.recurrence_interval, template.day_of_month);
        break;
      case 'yearly':
        scheduledDate.setFullYear(startDate.getFullYear() + i * template.recurrence_interval, template.month_of_year - 1, template.day_of_month);
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
    // Clear existing future occurrences to prevent duplicates
    await sql`
      DELETE FROM maintenance_occurrences
      WHERE template_id = ${template.id} AND scheduled_date >= ${startDate.toISOString().split('T')[0]}
    `;

    const insertQueries = occurrences.map(o => sql`
      INSERT INTO maintenance_occurrences (template_id, scheduled_date, assigned_to, status, priority)
      VALUES (${o.templateId}, ${o.scheduledDate}, ${o.assignedTo}, ${o.status}, ${o.priority})
    `);
    
    await Promise.all(insertQueries);
  }
}
