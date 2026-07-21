import { PrismaClient, type AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Triple Entente database…");

  // Clean slate (order respects FK constraints)
  await prisma.mark.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("password123", 10);

  // Courses
  const foundation = await prisma.course.create({
    data: { slug: "foundation", name: "Foundation Programme", classes: "Class 8–10" },
  });
  const senior = await prisma.course.create({
    data: { slug: "class-11-12", name: "Class 11 & 12", classes: "Class 11–12" },
  });

  // Admin
  await prisma.user.create({
    data: {
      email: "admin@tripleentente.in",
      name: "Ayush Anand",
      passwordHash: pw,
      role: "ADMIN",
      phone: "7979010269",
    },
  });

  // Teacher
  const teacherUser = await prisma.user.create({
    data: {
      email: "teacher@tripleentente.in",
      name: "S. Priya",
      passwordHash: pw,
      role: "TEACHER",
      teacher: { create: { subject: "Physics & Mathematics" } },
    },
    include: { teacher: true },
  });

  // Batches
  const batchXII = await prisma.batch.create({
    data: {
      name: "XII-Science-A",
      year: "2025-26",
      courseId: senior.id,
      teacherId: teacherUser.teacher!.id,
      feeAmount: 36000,
    },
  });
  const batchX = await prisma.batch.create({
    data: {
      name: "X-Foundation-A",
      year: "2025-26",
      courseId: foundation.id,
      teacherId: teacherUser.teacher!.id,
      feeAmount: 24000,
    },
  });

  // Parent
  const parentUser = await prisma.user.create({
    data: {
      email: "parent@tripleentente.in",
      name: "Mr. R. Sharma",
      passwordHash: pw,
      role: "PARENT",
      parent: { create: {} },
    },
    include: { parent: true },
  });

  // Primary student (linked to parent + login)
  const studentUser = await prisma.user.create({
    data: {
      email: "student@tripleentente.in",
      name: "Aarav Sharma",
      passwordHash: pw,
      role: "STUDENT",
      student: {
        create: {
          rollNo: "TE-101",
          className: "Class 12",
          guardianName: "Mr. R. Sharma",
          parentId: parentUser.parent!.id,
          enrollments: { create: { batchId: batchXII.id } },
        },
      },
    },
    include: { student: true },
  });
  const aarav = studentUser.student!;

  // A few more students in each batch
  const moreStudents = [
    { name: "Riya Verma", roll: "TE-102", cls: "Class 12", batch: batchXII.id },
    { name: "Sahil Kumar", roll: "TE-103", cls: "Class 12", batch: batchXII.id },
    { name: "Ishita Roy", roll: "TE-201", cls: "Class 10", batch: batchX.id },
    { name: "Karan Mehta", roll: "TE-202", cls: "Class 10", batch: batchX.id },
  ];
  const created = [];
  for (const s of moreStudents) {
    const u = await prisma.user.create({
      data: {
        email: `${s.roll.toLowerCase()}@tripleentente.in`,
        name: s.name,
        passwordHash: pw,
        role: "STUDENT",
        student: {
          create: {
            rollNo: s.roll,
            className: s.cls,
            enrollments: { create: { batchId: s.batch } },
          },
        },
      },
      include: { student: true },
    });
    created.push(u.student!);
  }

  // Payments for Aarav (partial — leaves a due)
  await prisma.payment.createMany({
    data: [
      { studentId: aarav.id, amount: 12000, mode: "UPI", receiptNo: "TE-RC-00001", forMonth: "April" },
      { studentId: aarav.id, amount: 12000, mode: "CASH", receiptNo: "TE-RC-00002", forMonth: "July" },
    ],
  });

  // Attendance for Aarav (last 10 days)
  const allXII = [aarav, ...created.filter((c) => c.className === "Class 12")];
  const today = new Date();
  const attData: { studentId: string; batchId: string; date: Date; status: AttendanceStatus }[] = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    for (const st of allXII) {
      attData.push({
        studentId: st.id,
        batchId: batchXII.id,
        date: d,
        status: i % 7 === 0 ? "ABSENT" : "PRESENT",
      });
    }
  }
  await prisma.attendance.createMany({ data: attData });

  // Exams + marks for XII batch
  const exam1 = await prisma.exam.create({
    data: { title: "Unit Test 1", subject: "Physics", batchId: batchXII.id, maxMarks: 50 },
  });
  const exam2 = await prisma.exam.create({
    data: { title: "Monthly Test", subject: "Mathematics", batchId: batchXII.id, maxMarks: 100 },
  });
  for (const st of allXII) {
    await prisma.mark.create({
      data: { examId: exam1.id, studentId: st.id, score: 38 + Math.floor((st.rollNo.charCodeAt(4) % 10)) },
    });
    await prisma.mark.create({
      data: { examId: exam2.id, studentId: st.id, score: 72 + Math.floor((st.rollNo.charCodeAt(4) % 20)) },
    });
  }

  // A couple of website inquiries
  await prisma.inquiry.createMany({
    data: [
      { name: "Neha Singh", phone: "9876500011", className: "Class 11", message: "Interested in science batch.", status: "NEW" },
      { name: "Amit Joshi", phone: "9876500022", className: "Class 9", email: "amit@example.com", status: "CONTACTED" },
    ],
  });

  // Notices
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  await prisma.notice.createMany({
    data: [
      { title: "New session begins 1st April", body: "Classes for the 2025-26 session start on 1st April. Please ensure fees are cleared.", audience: "ALL", authorId: admin.id },
      { title: "Unit Test 1 schedule", body: "Unit Test 1 for Class XII will be held next week. Check the timetable.", audience: "STUDENTS", authorId: admin.id },
    ],
  });

  // Demo fee slips: one PENDING (Aarav) and one already PAID (Riya) with receipt
  await prisma.feeSlip.create({
    data: {
      slipNo: "TE-SLIP-00001",
      studentId: aarav.id,
      amount: 12000,
      mode: "UPI",
      forMonth: "October",
      status: "PENDING",
      createdById: studentUser.id,
    },
  });
  const riya = created.find((c) => c.rollNo === "TE-102");
  if (riya) {
    const paidPayment = await prisma.payment.create({
      data: {
        studentId: riya.id,
        amount: 12000,
        mode: "CASH",
        receiptNo: "TE-RC-00003",
        forMonth: "October",
        note: "Fee slip TE-SLIP-00002",
      },
    });
    await prisma.feeSlip.create({
      data: {
        slipNo: "TE-SLIP-00002",
        studentId: riya.id,
        amount: 12000,
        mode: "CASH",
        forMonth: "October",
        status: "PAID",
        receiptNo: "TE-RC-00003",
        paymentId: paidPayment.id,
        reviewedAt: new Date(),
        createdById: admin.id,
      },
    });
  }

  // A welcome notification for the student & parent
  await prisma.notification.createMany({
    data: [
      { userId: studentUser.id, title: "Welcome to Triple Entente", body: "You can now generate fee slips and view your results here.", href: "/dashboard" },
      { userId: parentUser.id, title: "Welcome to Triple Entente", body: "Track your child's fees, attendance and results from this portal.", href: "/dashboard" },
    ],
  });

  console.log("✅ Seed complete.");
  console.log("   Logins (password: password123):");
  console.log("   • admin@tripleentente.in   (Admin)");
  console.log("   • teacher@tripleentente.in (Teacher)");
  console.log("   • student@tripleentente.in (Student — Aarav)");
  console.log("   • parent@tripleentente.in  (Parent — Aarav's father)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
