import { getDbSql } from './db';

// Generate occurrences for the next 12 months by default
const OCCURRENCES_TO_GENERATE = 12;

export async function generateOccurrences(template) {
  const sql = getDbSql();
  const occurrences = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize current date

  for (let i = 0; i < OCCURRENCES_TO_GENERATE; i++) {
    const scheduledDate = new Date(now);

    switch (template.recurrence_type) {
      case 'daily':
        scheduledDate.setDate(now.getDate() + i * template.recurrence_interval);
        break;
      case 'weekly':
        // Start from the next occurrence of the specified day_of_week
        const currentDay = now.getDay();
        const desiredDay = template.day_of_week; // 0-6
        let dayDifference = desiredDay - currentDay;
        if (dayDifference < 0) {
          dayDifference += 7;
        }
        // For subsequent weeks, add the interval in weeks
        scheduledDate.setDate(now.getDate() + dayDifference + (i * template.recurrence_interval * 7));
        break;
      case 'monthly':
        // For monthly recurrence, we want to start from the current month
        // Add the appropriate number of months first
        scheduledDate.setMonth(now.getMonth() + i * template.recurrence_interval);
        // Then set the day of the month from the template
        // Handle cases where the day doesn't exist in the month (e.g., 31st in February)
        const daysInMonth = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(template.day_of_month, daysInMonth);
        scheduledDate.setDate(targetDay);
        break;
      case 'yearly':
        // Set the year first
        scheduledDate.setFullYear(now.getFullYear() + i * template.recurrence_interval);
        // Set the month (0-indexed, so subtract 1)
        scheduledDate.setMonth(template.month_of_year - 1);
        // Set the day, handling cases where the day doesn't exist in the month
        const yearlyDaysInMonth = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth() + 1, 0).getDate();
        const yearlyTargetDay = Math.min(template.day_of_month, yearlyDaysInMonth);
        scheduledDate.setDate(yearlyTargetDay);
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
      WHERE template_id = ${template.id} AND scheduled_date >= ${now.toISOString().split('T')[0]}
    `;

    // Only insert occurrences that are in the future or today
    const validOccurrences = occurrences.filter(occ => 
      new Date(occ.scheduledDate) >= new Date(now.setHours(0, 0, 0, 0))
    );

    if (validOccurrences.length > 0) {
      const insertQueries = validOccurrences.map(o => sql`
        INSERT INTO maintenance_occurrences (template_id, scheduled_date, assigned_to, status, priority)
        VALUES (${o.templateId}, ${o.scheduledDate}, ${o.assignedTo}, ${o.status}, ${o.priority})
      `);
      
      await Promise.all(insertQueries);
    }
  }
}
