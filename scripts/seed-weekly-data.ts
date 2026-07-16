import { prisma } from "../lib/db"

const TECH_IDS = [
  "b6de8376-ece7-4f0c-a40b-545806f29b15", // TOYE OYENIRAN
  "0a7924f9-7c63-4e35-ae09-a410519bc71d", // ADEMOLA HAMMED
  "924068f0-fbb2-48e4-a913-4d1473f182b0", // Busayo Ogunniyi
  "d94cd5d8-0be1-4cd9-afdc-3aaf97065f40", // Joseph Ishola
  "c7fb68ad-2b7a-48e1-8c4d-623df6a15587", // TIMILEHIN ADIO
  "350958de-ae40-49e4-b4e7-6e570fef2c88", // Oluwarotimi Adewumi
  "bc31adb3-c9be-415f-b147-32955df2b9b0", // Victoria Aderibigbe
  "df8dcbda-f224-4d0b-b5cf-da165e7fe9e2", // Tolulope Babatunde
  "3daf3cfa-8b62-4497-84b8-2ec0c8d39a53", // Adebanke Adebanke
]

const ADMIN_ID = "bd5f35cd-fbce-454e-ac4f-6301a38d792b"

const SOLAR_TYPE = "7f5269d4-38be-4009-a8e7-8c9731fd7956"
const INSTALL_TYPE = "756d695f-f655-45ad-bd7f-d95fcfe8031f"

const LOCATIONS = [
  { address: "15 Awolowo Road, Ikoyi, Lagos", lat: 6.4493, lng: 3.4353 },
  { address: "42 Admiralty Way, Lekki Phase 1, Lagos", lat: 6.4397, lng: 3.4491 },
  { address: "7 Tinubu Street, Ikeja, Lagos", lat: 6.6017, lng: 3.3515 },
  { address: "23 Awolowo Way, Ikeja, Lagos", lat: 6.5945, lng: 3.3437 },
  { address: "10B Bourdillon Road, Ikoyi, Lagos", lat: 6.4523, lng: 3.4292 },
  { address: "88a Norman Williams Street, Ikoyi, Lagos", lat: 6.4551, lng: 3.4324 },
  { address: "3 Ribadu Road, Ikoyi, Lagos", lat: 6.4476, lng: 3.4278 },
  { address: "25 Mobolaji Bank Anthony Way, Ikeja, Lagos", lat: 6.5874, lng: 3.3617 },
  { address: "50 Opebi Road, Ikeja, Lagos", lat: 6.5989, lng: 3.3584 },
  { address: "12a T.F. Kuboye Street, Lekki Phase 1, Lagos", lat: 6.4402, lng: 3.4521 },
  { address: "9 Gerrard Road, Ikoyi, Lagos", lat: 6.4498, lng: 3.4311 },
  { address: "30 Adeola Odeku Street, Victoria Island, Lagos", lat: 6.4297, lng: 3.4218 },
  { address: "22 Akin Adesola Street, Victoria Island, Lagos", lat: 6.4271, lng: 3.4183 },
  { address: "15 Sanusi Fafunwa Street, Victoria Island, Lagos", lat: 6.4253, lng: 3.4156 },
  { address: "60 Alpha Beach Road, Lekki, Lagos", lat: 6.4518, lng: 3.5412 },
  { address: "3 Chief Yesufu Abiodun, Oniru, Lagos", lat: 6.4431, lng: 3.4558 },
  { address: "7 Oduduwa Way, Ikeja GRA, Lagos", lat: 6.6025, lng: 3.3431 },
  { address: "19 Olosa Street, Victoria Island, Lagos", lat: 6.4265, lng: 3.4167 },
]

interface DaySchedule {
  date: Date
  dayName: string
  jobs: JobSlot[]
}

interface JobSlot {
  typeId: string
  title: string
  description: string
  techIndices: number[]
  locIndex: number
  startHour: number
  durationHours: number
  value: number
  priority: string
  instructions: string
}

const schedules: DaySchedule[] = [
  {
    date: new Date("2026-07-06"),
    dayName: "Monday",
    jobs: [
      { typeId: SOLAR_TYPE, title: "Solar Panel Cleaning - Ikoyi", description: "Routine cleaning of solar panels at residential building", techIndices: [0, 1], locIndex: 0, startHour: 7, durationHours: 3, value: 65000, priority: "high", instructions: "Use soft brush and distilled water. Check for micro-cracks." },
      { typeId: INSTALL_TYPE, title: "New Installation - Lekki Phase 1", description: "Full solar panel installation for 3-bedroom duplex", techIndices: [2, 3], locIndex: 1, startHour: 8, durationHours: 6, value: 350000, priority: "high", instructions: "Install 8x 400W panels. Mount on tile roof with rail system." },
      { typeId: SOLAR_TYPE, title: "Solar Panel Cleaning - Ikeja", description: "Commercial solar array cleaning at office complex", techIndices: [4, 5], locIndex: 2, startHour: 9, durationHours: 3, value: 85000, priority: "medium", instructions: "Clean all 24 panels. Log any damage found." },
      { typeId: INSTALL_TYPE, title: "Inverter Upgrade - Victoria Island", description: "Replace old inverter with new hybrid model", techIndices: [6, 7], locIndex: 11, startHour: 10, durationHours: 4, value: 180000, priority: "medium", instructions: "Disconnect old inverter. Install 5kVA hybrid inverter." },
    ],
  },
  {
    date: new Date("2026-07-07"),
    dayName: "Tuesday",
    jobs: [
      { typeId: SOLAR_TYPE, title: "Solar Panel Cleaning - Surulere", description: "Routine cleaning for 4-unit apartment block", techIndices: [8, 0], locIndex: 3, startHour: 7, durationHours: 3, value: 55000, priority: "medium", instructions: "Clean panels and trim nearby tree branches." },
      { typeId: INSTALL_TYPE, title: "Installation - Yaba", description: "Solar installation for tech startup office", techIndices: [1, 2], locIndex: 4, startHour: 8, durationHours: 5, value: 280000, priority: "high", instructions: "Install 6x 450W panels on flat roof using ballast mount." },
      { typeId: SOLAR_TYPE, title: "Panel Cleaning - Bourdillon", description: "Scheduled cleaning for luxury villa", techIndices: [3, 4], locIndex: 5, startHour: 9, durationHours: 2, value: 45000, priority: "low", instructions: "Gentle cleaning only. Client is sensitive about noise." },
      { typeId: INSTALL_TYPE, title: "Battery Bank Installation - Ikoyi", description: "Add battery storage to existing solar setup", techIndices: [5, 6], locIndex: 6, startHour: 10, durationHours: 5, value: 220000, priority: "medium", instructions: "Install 4x 200Ah lithium batteries. Configure inverter settings." },
    ],
  },
  {
    date: new Date("2026-07-08"),
    dayName: "Wednesday",
    jobs: [
      { typeId: SOLAR_TYPE, title: "Panel Cleaning - Mobolaji Bank Anthony", description: "Commercial cleaning for office building", techIndices: [7, 8], locIndex: 7, startHour: 7, durationHours: 3, value: 75000, priority: "medium", instructions: "Clean 30 panels on the rooftop. Use safety harness." },
      { typeId: INSTALL_TYPE, title: "Installation - Opebi", description: "Complete solar system for restaurant", techIndices: [0, 2], locIndex: 8, startHour: 8, durationHours: 6, value: 380000, priority: "high", instructions: "Install 10x 400W panels, 5kVA inverter, 4 batteries." },
      { typeId: SOLAR_TYPE, title: "Panel Cleaning - Lekki T.F. Kuboye", description: "Routine residential panel cleaning", techIndices: [4, 6], locIndex: 9, startHour: 10, durationHours: 2, value: 40000, priority: "low", instructions: "Standard cleaning. Check wiring connections." },
      { typeId: INSTALL_TYPE, title: "Installation - Gerrard Road", description: "Solar system for new building construction", techIndices: [1, 3], locIndex: 10, startHour: 9, durationHours: 7, value: 420000, priority: "high", instructions: "Install 12x 400W panels, 7.5kVA inverter, 6 batteries." },
    ],
  },
  {
    date: new Date("2026-07-09"),
    dayName: "Thursday",
    jobs: [
      { typeId: SOLAR_TYPE, title: "Panel Cleaning - Adeola Odeku", description: "Commercial cleaning for bank building", techIndices: [5, 7], locIndex: 11, startHour: 7, durationHours: 3, value: 95000, priority: "high", instructions: "Clean all panels on the rooftop. Must be done before 11 AM." },
      { typeId: INSTALL_TYPE, title: "Installation - Akin Adesola", description: "Solar system for retail store", techIndices: [8, 0], locIndex: 12, startHour: 8, durationHours: 5, value: 260000, priority: "medium", instructions: "Install 6x 400W panels, 3.5kVA inverter, 2 batteries." },
      { typeId: SOLAR_TYPE, title: "Panel Cleaning - Sanusi Fafunwa", description: "Regular maintenance of office solar array", techIndices: [2, 4], locIndex: 13, startHour: 9, durationHours: 2, value: 50000, priority: "low", instructions: "Routine cleaning and performance check." },
      { typeId: INSTALL_TYPE, title: "Installation - Alpha Beach Road", description: "Complete off-grid system for beach house", techIndices: [1, 6], locIndex: 14, startHour: 8, durationHours: 8, value: 480000, priority: "high", instructions: "Install 16x 400W panels, 10kVA inverter, 8 batteries." },
    ],
  },
  {
    date: new Date("2026-07-10"),
    dayName: "Friday",
    jobs: [
      { typeId: SOLAR_TYPE, title: "Panel Cleaning - Oniru", description: "Residential cleaning for estate house", techIndices: [3, 5], locIndex: 15, startHour: 7, durationHours: 2, value: 35000, priority: "low", instructions: "Standard cleaning with water-fed pole system." },
      { typeId: INSTALL_TYPE, title: "Installation - Oduduwa Way", description: "Solar system for government official residence", techIndices: [7, 8], locIndex: 16, startHour: 8, durationHours: 6, value: 450000, priority: "high", instructions: "Install 10x 450W panels, 7.5kVA inverter, 6 batteries. Security clearance required." },
      { typeId: SOLAR_TYPE, title: "Panel Cleaning & Inspection - Olosa Street", description: "Cleaning plus full system inspection", techIndices: [0, 1], locIndex: 17, startHour: 9, durationHours: 4, value: 110000, priority: "medium", instructions: "Clean panels, check all connections, inverter, and battery health." },
    ],
  },
  {
    date: new Date("2026-07-11"),
    dayName: "Saturday",
    jobs: [
      { typeId: INSTALL_TYPE, title: "Installation - Mobolaji Bank Anthony", description: "Weekend installation for office building", techIndices: [2, 3], locIndex: 7, startHour: 8, durationHours: 6, value: 320000, priority: "medium", instructions: "Install 8x 400W panels, 5kVA inverter, 4 batteries." },
      { typeId: SOLAR_TYPE, title: "Panel Cleaning - Lekki Phase 1", description: "Weekend cleaning slot for client", techIndices: [4, 6], locIndex: 1, startHour: 7, durationHours: 3, value: 60000, priority: "medium", instructions: "Clean panels. Client will be home, maintain professional conduct." },
      { typeId: INSTALL_TYPE, title: "Installation - Bourdillon", description: "Full installation for luxury duplex", techIndices: [5, 8], locIndex: 5, startHour: 8, durationHours: 7, value: 520000, priority: "high", instructions: "Install 14x 400W panels, 10kVA inverter, 8 lithium batteries." },
      { typeId: SOLAR_TYPE, title: "Emergency Panel Cleaning - Ikoyi", description: "Urgent cleaning after construction dust", techIndices: [0, 7], locIndex: 0, startHour: 10, durationHours: 2, value: 70000, priority: "high", instructions: "Urgent cleaning. Panels covered in construction debris." },
    ],
  },
]

function tech(ids: number[]): string[] {
  return ids.map((i) => TECH_IDS[i])
}

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

async function main() {
  console.log("Starting seed: generating jobs and time entries for Mon-Sat (July 6-11, 2026)...")
  console.log(`Using ${TECH_IDS.length} technicians + admin\n`)

  let totalJobs = 0
  let totalTimeEntries = 0

  for (const day of schedules) {
    for (const slot of day.jobs) {
      const scheduledDate = new Date(day.date)
      const scheduledTime = new Date(day.date)
      scheduledTime.setHours(slot.startHour, 0, 0, 0)

      const job = await prisma.job.create({
        data: {
          title: slot.title,
          description: slot.description,
          jobTypeId: slot.typeId,
          createdBy: ADMIN_ID,
          status: "completed",
          priority: slot.priority,
          locationAddress: LOCATIONS[slot.locIndex].address,
          locationLat: LOCATIONS[slot.locIndex].lat,
          locationLng: LOCATIONS[slot.locIndex].lng,
          scheduledDate: scheduledDate,
          scheduledTime: scheduledTime,
          jobValue: slot.value,
          instructions: slot.instructions,
          completedAt: new Date(scheduledTime.getTime() + slot.durationHours * 60 * 60 * 1000),
        },
      })

      for (const techId of tech(slot.techIndices)) {
        const clockInMinutes = Math.floor(Math.random() * 15)
        const clockInTime = new Date(scheduledTime.getTime() + clockInMinutes * 60 * 1000)

        const workDurationMinutes = slot.durationHours * 60 + Math.floor(Math.random() * 30) - 15
        const clockOutTime = new Date(clockInTime.getTime() + workDurationMinutes * 60 * 1000)

        await prisma.timeEntry.create({
          data: {
            userId: techId,
            jobId: job.id,
            clockIn: clockInTime,
            clockOut: clockOutTime,
            latitude: LOCATIONS[slot.locIndex].lat + randomInRange(-0.001, 0.001),
            longitude: LOCATIONS[slot.locIndex].lng + randomInRange(-0.001, 0.001),
            notes: `Worked on ${slot.title}`,
          },
        })

        await prisma.jobTechnician.create({
          data: {
            jobId: job.id,
            technicianId: techId,
            role: slot.techIndices.indexOf(TECH_IDS.indexOf(techId)) === 0 ? "lead" : "assistant",
            rating: parseFloat((4 + Math.random()).toFixed(1)),
            feedback: "Good work completed.",
            completedAt: clockOutTime,
          },
        })
      }

      totalJobs++
      totalTimeEntries += slot.techIndices.length
      console.log(`  ✓ ${day.dayName}: ${slot.title} (${slot.techIndices.length} techs)`)
    }
  }

  console.log(`\n✅ Done! Created ${totalJobs} jobs and ${totalTimeEntries} time entries.`)
}

main().catch((e) => {
  console.error("Seed failed:", e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
