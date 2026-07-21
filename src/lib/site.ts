/**
 * Single source of truth for institute branding & content.
 * Edit here to rebrand the entire site + ERP.
 */
export const site = {
  name: "Triple Entente",
  shortName: "Triple Entente",
  tagline: "Study Hard, Result Best",
  description:
    "A results-driven coaching institute for Foundation (Class 8–10) and Class 11–12 students — disciplined mentoring, expert faculty, and a proven track record.",
  established: 2016,
  phone: "7979010269",
  phoneDisplay: "+91 79790 10269",
  email: "ayush00ansh@gmail.com",
  address: {
    line1: "Karma Road, near Police Line",
    line2: "Back of Police Line",
    city: "[City]",
    full: "Karma Road, near Police Line (back of Police Line)",
  },
  hours: "Mon–Sat · 7:00 AM – 8:00 PM",
  social: {
    instagram: "#",
    facebook: "#",
    youtube: "#",
    whatsapp: "https://wa.me/917979010269",
  },
} as const;

export const courses = [
  {
    slug: "foundation",
    name: "Foundation Programme",
    classes: "Class 8 – 10",
    tagline: "Build unshakeable basics early.",
    description:
      "A concept-first programme that strengthens Mathematics, Science and reasoning for Classes 8 to 10 — preparing students for boards and laying the runway for competitive exams.",
    subjects: ["Mathematics", "Science (Phy · Chem · Bio)", "Mental Ability", "English"],
    highlights: [
      "Concept-building from first principles",
      "Weekly tests & personalised feedback",
      "Board-pattern practice & doubt sessions",
      "Olympiad & NTSE orientation",
    ],
    duration: "Yearly · regular batches",
  },
  {
    slug: "class-11-12",
    name: "Class 11 & 12",
    classes: "Class 11 – 12",
    tagline: "Master the senior syllabus with confidence.",
    description:
      "Rigorous coaching for Class 11 and 12 — deep subject mastery, board excellence and a structured path through the senior-secondary syllabus with continuous assessment.",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    highlights: [
      "In-depth theory + problem solving",
      "Regular chapter & unit tests",
      "Board + competitive orientation",
      "Performance analytics for every student",
    ],
    duration: "2-year & 1-year tracks",
  },
] as const;

export const stats = [
  { value: "8+", label: "Years of mentoring" },
  { value: "1200+", label: "Students taught" },
  { value: "95%", label: "Board distinction rate" },
  { value: "30+", label: "Toppers in district" },
];

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/faculty", label: "Faculty" },
  { href: "/results", label: "Results" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];
