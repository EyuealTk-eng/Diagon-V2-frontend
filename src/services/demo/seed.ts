// Sample data for demo mode. Mirrors what the real backend seeds (campuses, categories).

export interface DemoCampus {
  id: number;
  name: string;
  slug: string;
}

export interface DemoCategory {
  id: number;
  name_en: string;
  name_am: string;
  slug: string;
  parent: string | null;
}

export const UNIVERSITY = { id: 1, name: "Addis Ababa University", slug: "aau" };

export const CAMPUSES: DemoCampus[] = [
  ["4 Kilo (Arat Kilo)", "4-kilo"],
  ["5 Kilo (Amist Kilo)", "5-kilo"],
  ["6 Kilo (Sidist Kilo)", "6-kilo"],
  ["Akaki", "akaki"],
  ["Bishoftu", "bishoftu"],
  ["Lideta (Commerce)", "lideta"],
  ["Sefere Selam", "sefere-selam"],
  ["Tikur Anbessa (Black Lion)", "tikur-anbessa"],
  ["Yared School of Music", "yared"],
].map(([name, slug], i) => ({ id: i + 1, name, slug }));

const CATEGORY_TREE: [string, string, string, [string, string, string][]][] = [
  ["Electronics", "ኤሌክትሮኒክስ", "electronics", [
    ["Phones", "ስልኮች", "phones"],
    ["Calculators", "ካልኩሌተሮች", "calculators"],
    ["Audio & headphones", "የድምፅ መሣሪያዎች", "audio"],
  ]],
  ["Computers", "ኮምፒውተሮች", "computers", [
    ["Laptops", "ላፕቶፖች", "laptops"],
    ["Desktops & monitors", "ዴስክቶፕ እና ማሳያዎች", "desktops-monitors"],
    ["Computer accessories", "የኮምፒውተር መለዋወጫዎች", "computer-accessories"],
  ]],
  ["Books & Academic", "መጻሕፍት እና ትምህርታዊ", "books-academic", [
    ["Textbooks", "የመማሪያ መጻሕፍት", "textbooks"],
    ["Exam prep", "የፈተና ዝግጅት", "exam-prep"],
    ["Stationery", "የጽሕፈት መሣሪያዎች", "stationery"],
  ]],
  ["Clothes", "ልብሶች", "clothes", []],
  ["Accessories", "መለዋወጫዎች", "accessories", []],
  ["Furniture", "የቤት ዕቃዎች", "furniture", []],
  ["Services", "አገልግሎቶች", "services", [
    ["Tutoring", "ማስጠናት", "tutoring"],
    ["Design", "ዲዛይን", "design"],
    ["Repairs", "ጥገና", "repairs"],
    ["Printing", "ኅትመት", "printing"],
  ]],
  ["Other", "ሌሎች", "other", []],
];

export const CATEGORIES: DemoCategory[] = (() => {
  const out: DemoCategory[] = [];
  let id = 1;
  for (const [en, am, slug, children] of CATEGORY_TREE) {
    out.push({ id: id++, name_en: en, name_am: am, slug, parent: null });
    for (const [cEn, cAm, cSlug] of children) out.push({ id: id++, name_en: cEn, name_am: cAm, slug: cSlug, parent: slug });
  }
  return out;
})();

export interface SeedUser {
  key: string;
  email: string;
  password: string;
  display_name: string;
  campus: string | null;
  telegram_username: string;
  is_verified: boolean;
  is_staff: boolean;
}

// Shown on the login page so anyone can try the demo.
export const DEMO_ACCOUNTS: SeedUser[] = [
  { key: "selam", email: "demo.seller@aau.edu.et", password: "demo-pass-123", display_name: "Selam T.", campus: "5-kilo", telegram_username: "diagon_demo_selam", is_verified: true, is_staff: false },
  { key: "admin", email: "admin@aau.edu.et", password: "admin-pass-123", display_name: "Diagon Admin", campus: "6-kilo", telegram_username: "", is_verified: true, is_staff: true },
];

export const OTHER_SELLERS: SeedUser[] = [
  { key: "dawit", email: "dawit.k@example.com", password: "not-a-login-1", display_name: "Dawit K.", campus: "4-kilo", telegram_username: "diagon_demo_dawit", is_verified: false, is_staff: false },
  { key: "hana", email: "hana.m@aau.edu.et", password: "not-a-login-2", display_name: "Hana M.", campus: "6-kilo", telegram_username: "diagon_demo_hana", is_verified: true, is_staff: false },
];

export interface SeedListing {
  seller: string;
  title: string;
  category: string;
  price: number;
  campus: string;
  condition?: "new" | "like_new" | "good" | "fair";
  pricing_type?: "fixed" | "hourly" | "negotiable";
  availability?: string;
  description: string;
  photos: number;
  status?: "available" | "sold";
  hoursAgo: number;
}

export const SEED_LISTINGS: SeedListing[] = [
  { seller: "selam", title: "ThinkPad T480 — 16GB RAM, 512GB SSD", category: "laptops", price: 28500, campus: "5-kilo", condition: "good", photos: 3, hoursAgo: 2,
    description: "Intel i5 8th gen, 16GB RAM, 512GB SSD. Battery lasts about 5 hours. Small scratch on the lid, otherwise perfect. Comes with the original charger." },
  { seller: "dawit", title: "Casio fx-991ES Plus calculator", category: "calculators", price: 1400, campus: "4-kilo", condition: "like_new", photos: 2, hoursAgo: 5,
    description: "Used for one semester. All buttons work, includes the slide cover. Allowed in most engineering exams." },
  { seller: "hana", title: "Calculus: Early Transcendentals (8th ed.)", category: "textbooks", price: 900, campus: "6-kilo", condition: "good", photos: 2, hoursAgo: 9,
    description: "Stewart, 8th edition. Some highlighting in the first four chapters. Great for Applied Math I and II." },
  { seller: "selam", title: "Samsung Galaxy A14, 128GB", category: "phones", price: 9800, campus: "5-kilo", condition: "like_new", photos: 2, hoursAgo: 20,
    description: "128GB storage, 4GB RAM. Screen protector on since day one. Box and charger included." },
  { seller: "dawit", title: "Study desk with drawer", category: "furniture", price: 3500, campus: "sefere-selam", condition: "fair", photos: 1, hoursAgo: 30,
    description: "Solid wood desk, 100 × 50 cm. One drawer sticks a little. You'll need to pick it up near Sefere Selam campus." },
  { seller: "hana", title: "Sony WH-CH520 headphones", category: "audio", price: 4200, campus: "6-kilo", condition: "new", photos: 2, hoursAgo: 34,
    description: "Brand new, still sealed. Wrong colour gift. Up to 50 hours battery life." },
  { seller: "hana", title: "Habesha kemis, medium", category: "clothes", price: 2600, campus: "lideta", condition: "like_new", photos: 2, hoursAgo: 48,
    description: "Worn once for a graduation event. Hand-woven with a green and gold tibeb border." },
  { seller: "selam", title: "24\" Dell monitor", category: "desktops-monitors", price: 7600, campus: "5-kilo", condition: "good", photos: 1, hoursAgo: 52,
    description: "Full HD, HDMI and VGA. Stand included. Perfect second screen for programming." },
  { seller: "dawit", title: "Exam prep notes — Applied Math I", category: "exam-prep", price: 250, campus: "4-kilo", condition: "good", photos: 1, hoursAgo: 60,
    description: "Hand-written summary notes plus solved past exams from the last three years. Printed and bound." },
  { seller: "hana", title: "Backpack, water-resistant", category: "accessories", price: 1800, campus: "tikur-anbessa", condition: "new", photos: 1, hoursAgo: 75,
    description: "Fits a 15.6\" laptop, padded straps, two side bottle pockets." },
  { seller: "dawit", title: "Engineering drawing set", category: "stationery", price: 650, campus: "5-kilo", condition: "good", photos: 1, hoursAgo: 90,
    description: "Compass, set squares, protractor and scale ruler in a hard case. Everything you need for first-year drawing." },
  { seller: "selam", title: "Wireless mouse + keyboard combo", category: "computer-accessories", price: 1500, campus: "5-kilo", condition: "like_new", photos: 1, hoursAgo: 110, status: "sold",
    description: "Logitech MK270. Works great, selling because I switched to a laptop stand setup." },
  { seller: "hana", title: "Physics & maths tutoring (freshman courses)", category: "tutoring", price: 300, campus: "4-kilo", pricing_type: "hourly", availability: "Weekday evenings, 4 Kilo library", photos: 1, hoursAgo: 14,
    description: "4th-year physics student. I tutor General Physics, Applied Math I and Logic. One-on-one or small groups." },
  { seller: "dawit", title: "Poster and slide design for club events", category: "design", price: 800, campus: "4-kilo", pricing_type: "fixed", availability: "2–3 day turnaround", photos: 1, hoursAgo: 40,
    description: "Event posters, social media graphics and presentation slides. Send me your idea and I'll share two drafts." },
  { seller: "selam", title: "Laptop repair and OS install", category: "repairs", price: 500, campus: "5-kilo", pricing_type: "negotiable", availability: "Saturdays at 5 Kilo", photos: 1, hoursAgo: 70,
    description: "Windows/Linux installs, virus cleanup, RAM and SSD upgrades. Price depends on the job." },
];

// --- Generated illustrations ------------------------------------------------

const PALETTE = ["#D98B68", "#647C6A", "#263746", "#E9DED0", "#B9694A", "#6F7779", "#F3DCCF"];

// Simple pictograms (24px grid) per category, drawn large on the illustration.
const ICONS: Record<string, string> = {
  electronics: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2",
  computers: "M5 6h14v9H5zM3 18h18",
  "books-academic": "M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zm0 13a3 3 0 0 1 3-3h9",
  clothes: "M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3c0 1.7-1.8 3-4 3S8 5.7 8 4Z",
  accessories: "M9 3h6l1 4H8zm-1 14h8l-1 4H9zM12 9v3l2 1m4-1a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z",
  furniture: "M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 11h18v6H3zm2 6v2m14-2v2",
  services: "M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-2.5z",
  other: "M5 12h.01M12 12h.01M19 12h.01",
};

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A warm, abstract product illustration as an SVG data URL. */
export function illustration(seed: number, topCategory: string): string {
  const r = rng(seed * 7919 + 13);
  const pick = () => PALETTE[Math.floor(r() * PALETTE.length)];
  const bg = pick();
  let fg = pick();
  if (fg === bg) fg = PALETTE[(PALETTE.indexOf(bg) + 2) % PALETTE.length];
  const light = ["#E9DED0", "#F3DCCF"].includes(bg);
  const stroke = light ? "#263746" : "#FFFCF7";
  const blobs = Array.from({ length: 3 }, () => {
    const cx = Math.round(r() * 800), cy = Math.round(r() * 600), rad = Math.round(90 + r() * 170);
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fg}" opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`;
  }).join("");
  const icon = ICONS[topCategory] ?? ICONS.other;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/>${blobs}` +
    `<g transform="translate(280 180) scale(10)" fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"><path d="${icon}"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
