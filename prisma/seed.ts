import { PrismaClient, Gender, ModelStatus, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function img(seed: string, w = 640, h = 800) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function gallery(seeds: string[]) {
  return JSON.stringify(seeds.map((s) => img(s, 900, 1200)));
}

type SeedModel = {
  name: string;
  category: string;
  gender: Gender;
  location: string;
  experience: string;
  status: ModelStatus;
  featured?: boolean;
  heightCm: number;
  bust?: number;
  waist?: number;
  hips?: number;
  shoeEu?: number;
  hairColor?: string;
  eyeColor?: string;
  instagram?: string;
  bio: string;
  seed: string;
  gallerySeeds: string[];
  reviewNote?: string;
};

const MODELS: SeedModel[] = [
  {
    name: "Amara Nkosi",
    category: "Runway",
    gender: Gender.FEMALE,
    location: "Cape Town, ZA",
    experience: "Established",
    status: ModelStatus.APPROVED,
    featured: true,
    heightCm: 179,
    bust: 82,
    waist: 61,
    hips: 89,
    shoeEu: 40,
    hairColor: "Black",
    eyeColor: "Brown",
    instagram: "amara.nkosi",
    bio: "Runway specialist with five seasons at Cape Town Fashion Week. Amara brings a commanding walk and an editorial eye, comfortable in both haute couture and ready-to-wear presentations. Represented internationally for campaign and catwalk work.",
    seed: "amara01",
    gallerySeeds: ["amara-g1", "amara-g2", "amara-g3", "amara-g4"],
  },
  {
    name: "Liam Foster",
    category: "Commercial",
    gender: Gender.MALE,
    location: "London, UK",
    experience: "Pro",
    status: ModelStatus.APPROVED,
    featured: true,
    heightCm: 186,
    waist: 81,
    shoeEu: 44,
    hairColor: "Brown",
    eyeColor: "Blue",
    instagram: "liamfoster",
    bio: "Versatile commercial and lifestyle model with a decade of experience across print, e-commerce and broadcast. Liam is a reliable, camera-ready professional known for a warm, approachable presence that brands love for national campaigns.",
    seed: "liam02",
    gallerySeeds: ["liam-g1", "liam-g2", "liam-g3"],
  },
  {
    name: "Sofia Marchetti",
    category: "Editorial",
    gender: Gender.FEMALE,
    location: "Milan, IT",
    experience: "Established",
    status: ModelStatus.APPROVED,
    featured: true,
    heightCm: 177,
    bust: 84,
    waist: 62,
    hips: 90,
    shoeEu: 39,
    hairColor: "Auburn",
    eyeColor: "Green",
    instagram: "sofia.marchetti",
    bio: "Editorial and beauty model with a distinctive, high-fashion look. Sofia has appeared in independent print titles across Europe and thrives on conceptual shoots that push creative boundaries. Strong movement and expression on set.",
    seed: "sofia03",
    gallerySeeds: ["sofia-g1", "sofia-g2", "sofia-g3", "sofia-g4"],
  },
  {
    name: "Devon Blake",
    category: "Fitness",
    gender: Gender.MALE,
    location: "Los Angeles, US",
    experience: "Established",
    status: ModelStatus.APPROVED,
    heightCm: 183,
    waist: 79,
    shoeEu: 43,
    hairColor: "Black",
    eyeColor: "Brown",
    instagram: "devonblake.fit",
    bio: "Fitness and athletic-wear model and certified personal trainer. Devon combines a defined physique with genuine athletic ability, making him a natural fit for activewear campaigns, supplement brands and dynamic action photography.",
    seed: "devon04",
    gallerySeeds: ["devon-g1", "devon-g2", "devon-g3"],
  },
  {
    name: "Yuki Tanaka",
    category: "Beauty",
    gender: Gender.FEMALE,
    location: "Tokyo, JP",
    experience: "Developing",
    status: ModelStatus.APPROVED,
    featured: true,
    heightCm: 171,
    bust: 80,
    waist: 60,
    hips: 87,
    shoeEu: 37,
    hairColor: "Black",
    eyeColor: "Brown",
    instagram: "yuki.tnk",
    bio: "Beauty and skincare specialist with flawless complexion and a calm, focused energy on set. Yuki has a growing portfolio of cosmetics work and is particularly sought after for close-up beauty and haircare campaigns.",
    seed: "yuki05",
    gallerySeeds: ["yuki-g1", "yuki-g2", "yuki-g3"],
  },
  {
    name: "Isabella Rossi",
    category: "Plus-Size",
    gender: Gender.FEMALE,
    location: "New York, US",
    experience: "Established",
    status: ModelStatus.APPROVED,
    heightCm: 175,
    bust: 104,
    waist: 84,
    hips: 112,
    shoeEu: 41,
    hairColor: "Brown",
    eyeColor: "Hazel",
    instagram: "bella.rossi",
    bio: "Confident, body-positive plus-size model championing inclusive fashion. Isabella has fronted several size-inclusive denim and lingerie campaigns and speaks publicly on representation in the industry. Reliable, professional and full of energy.",
    seed: "bella06",
    gallerySeeds: ["bella-g1", "bella-g2", "bella-g3"],
  },
  {
    name: "Noah Williams",
    category: "Fashion",
    gender: Gender.MALE,
    location: "Toronto, CA",
    experience: "Developing",
    status: ModelStatus.APPROVED,
    heightCm: 188,
    waist: 78,
    shoeEu: 45,
    hairColor: "Blonde",
    eyeColor: "Blue",
    instagram: "noah.w",
    bio: "Emerging fashion model with strong runway potential and a clean, versatile look. Noah has walked in two regional fashion weeks and is building a print portfolio. Coachable, punctual and eager to develop a long-term career.",
    seed: "noah07",
    gallerySeeds: ["noah-g1", "noah-g2"],
  },
  {
    name: "Priya Sharma",
    category: "Commercial",
    gender: Gender.FEMALE,
    location: "Mumbai, IN",
    experience: "Pro",
    status: ModelStatus.APPROVED,
    heightCm: 170,
    bust: 86,
    waist: 64,
    hips: 91,
    shoeEu: 38,
    hairColor: "Black",
    eyeColor: "Brown",
    instagram: "priya.sharma",
    bio: "Award-winning commercial model and occasional presenter with a magnetic on-camera personality. Priya has anchored national television commercials and lifestyle campaigns, bringing polish and authenticity to every brief.",
    seed: "priya08",
    gallerySeeds: ["priya-g1", "priya-g2", "priya-g3", "priya-g4"],
  },
  {
    name: "Elena Volkova",
    category: "Petite",
    gender: Gender.FEMALE,
    location: "Berlin, DE",
    experience: "Developing",
    status: ModelStatus.APPROVED,
    heightCm: 163,
    bust: 78,
    waist: 58,
    hips: 85,
    shoeEu: 36,
    hairColor: "Blonde",
    eyeColor: "Grey",
    instagram: "elena.vlk",
    bio: "Petite model with an expressive, editorial-leaning face. Elena excels at accessories, beauty and lookbook work where a distinctive presence matters more than height. Creative, dependable and a pleasure to collaborate with.",
    seed: "elena09",
    gallerySeeds: ["elena-g1", "elena-g2"],
  },
  // Pending (awaiting admin approval)
  {
    name: "Marcus Chen",
    category: "Fashion",
    gender: Gender.MALE,
    location: "Singapore, SG",
    experience: "New Face",
    status: ModelStatus.PENDING,
    heightCm: 184,
    waist: 80,
    shoeEu: 44,
    hairColor: "Black",
    eyeColor: "Brown",
    instagram: "marcus.chen",
    bio: "New face with a fresh, contemporary look and strong bone structure. Recently signed for development, Marcus is keen to build a fashion and editorial portfolio and is available for test shoots and lookbook work across Southeast Asia.",
    seed: "marcus10",
    gallerySeeds: ["marcus-g1", "marcus-g2"],
  },
  {
    name: "Zara Okafor",
    category: "Editorial",
    gender: Gender.FEMALE,
    location: "Lagos, NG",
    experience: "New Face",
    status: ModelStatus.PENDING,
    heightCm: 178,
    bust: 81,
    waist: 60,
    hips: 88,
    shoeEu: 40,
    hairColor: "Black",
    eyeColor: "Brown",
    instagram: "zara.okafor",
    bio: "Striking new face with a bold editorial presence and natural confidence in front of the camera. Zara is looking to break into high-fashion editorial and campaign work, and comes recommended by a local creative collective.",
    seed: "zara11",
    gallerySeeds: ["zara-g1", "zara-g2", "zara-g3"],
  },
  {
    name: "Oliver Brandt",
    category: "Commercial",
    gender: Gender.MALE,
    location: "Sydney, AU",
    experience: "Developing",
    status: ModelStatus.PENDING,
    heightCm: 181,
    waist: 82,
    shoeEu: 43,
    hairColor: "Brown",
    eyeColor: "Green",
    instagram: "oli.brandt",
    bio: "Friendly, relatable commercial model with a genuine everyman quality. Oliver has done regional retail and hospitality campaigns and is expanding into national work. Great with direction and comfortable improvising on set.",
    seed: "oliver12",
    gallerySeeds: ["oliver-g1", "oliver-g2"],
  },
  // Rejected example
  {
    name: "Test Submission",
    category: "Fashion",
    gender: Gender.NONBINARY,
    location: "Unknown",
    experience: "New Face",
    status: ModelStatus.REJECTED,
    heightCm: 170,
    bio: "Incomplete profile submitted without a full portfolio or verifiable references. Held for resubmission once professional images and contact details are provided per agency guidelines.",
    seed: "test13",
    gallerySeeds: [],
    reviewNote: "Portfolio images missing and bio too generic. Please resubmit with professional headshots.",
  },
];

const REVIEWS: Record<string, { rating: number; title: string; body: string; by: string }[]> = {
  "amara-nkosi": [
    { rating: 5, title: "Consummate professional", body: "Amara was flawless on our couture shoot — arrived prepared, took direction beautifully and the walk footage was usable on the first take.", by: "casting" },
    { rating: 5, title: "Booked her twice", body: "Reliable, punctual and genuinely lovely to work with. The whole crew wanted her back for the next campaign.", by: "photographer" },
    { rating: 4, title: "Strong runway presence", body: "Great energy on the catwalk. Would have loved a touch more range in the studio but overall excellent.", by: "user1" },
  ],
  "liam-foster": [
    { rating: 5, title: "Every client's favourite", body: "Liam is the definition of camera-ready. We shot three looks in under an hour and every frame worked.", by: "casting" },
    { rating: 5, title: "Warm and easy", body: "Brilliant with our talent-nervous first-timers on set. A total pro.", by: "user1" },
  ],
  "sofia-marchetti": [
    { rating: 5, title: "An editorial dream", body: "Sofia understands light and movement instinctively. Our concept shoot came alive because of her.", by: "photographer" },
    { rating: 4, title: "Very creative", body: "Wonderful to collaborate with on a conceptual brief. Highly recommended for editorial.", by: "user1" },
  ],
  "devon-blake": [
    { rating: 5, title: "Genuinely athletic", body: "So many fitness models can't actually perform the moves — Devon can. Made the action shots effortless.", by: "casting" },
    { rating: 4, title: "Solid activewear shoot", body: "Professional and in fantastic shape. Turnaround on selects was quick.", by: "user1" },
  ],
  "yuki-tanaka": [
    { rating: 5, title: "Perfect for beauty", body: "Yuki's skin photographs beautifully and she holds micro-expressions for close-ups without any fuss.", by: "photographer" },
    { rating: 5, title: "Calm and focused", body: "A pleasure on a long beauty day. Never lost her energy.", by: "user1" },
  ],
  "isabella-rossi": [
    { rating: 5, title: "Radiant on set", body: "Isabella brought so much confidence to our size-inclusive campaign. The images tested through the roof.", by: "casting" },
    { rating: 4, title: "Great advocate", body: "Professional and passionate about representation. Lovely to work with.", by: "user1" },
  ],
  "priya-sharma": [
    { rating: 5, title: "Made for camera", body: "Priya nailed the script and the improv. Our TVC director was thrilled.", by: "casting" },
  ],
  "noah-williams": [
    { rating: 4, title: "Promising new talent", body: "Noah has real runway potential. Coachable and keen — will go far with the right development.", by: "casting" },
  ],
  "elena-volkova": [
    { rating: 4, title: "Great for accessories", body: "Elena's expressive face carried our jewellery lookbook. Reliable and creative.", by: "photographer" },
  ],
};

async function main() {
  console.log("🌱  Seeding database…");

  // Wipe existing data (idempotent seed). Reviews and models first because
  // Model.reviewedBy references Admin.
  await prisma.review.deleteMany();
  await prisma.model.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // Admins live in their own table with their own credentials.
  const superAdmin = await prisma.admin.create({
    data: {
      name: "Agency Owner",
      email: "super@modelhub.test",
      passwordHash: await bcrypt.hash("superadmin1", 10),
      role: AdminRole.SUPER_ADMIN,
      avatarUrl: img("superadminavatar", 200, 200),
    },
  });

  const moderator = await prisma.admin.create({
    data: {
      name: "Roster Moderator",
      email: "mod@modelhub.test",
      passwordHash: await bcrypt.hash("moderator1", 10),
      role: AdminRole.MODERATOR,
      avatarUrl: img("moderatoravatar", 200, 200),
    },
  });

  // Public members: submit talent and leave reviews. No role — no admin access.
  const casting = await prisma.user.create({
    data: {
      name: "Casting Director",
      email: "casting@modelhub.test",
      passwordHash,
      avatarUrl: img("castingavatar", 200, 200),
    },
  });

  const photographer = await prisma.user.create({
    data: {
      name: "Studio Photographer",
      email: "photographer@modelhub.test",
      passwordHash,
      avatarUrl: img("photoavatar", 200, 200),
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: "Jordan Rivera",
      email: "user@modelhub.test",
      passwordHash,
      avatarUrl: img("user1avatar", 200, 200),
    },
  });

  const authorMap: Record<string, string> = {
    casting: casting.id,
    photographer: photographer.id,
    user1: user1.id,
  };

  for (const m of MODELS) {
    const slug = slugify(m.name);
    const submitter = m.status === ModelStatus.PENDING ? user1.id : casting.id;

    const created = await prisma.model.create({
      data: {
        slug,
        name: m.name,
        headshotUrl: img(m.seed),
        bio: m.bio,
        category: m.category,
        gender: m.gender,
        location: m.location,
        experience: m.experience,
        status: m.status,
        featured: m.featured ?? false,
        heightCm: m.heightCm,
        bust: m.bust,
        waist: m.waist,
        hips: m.hips,
        shoeEu: m.shoeEu,
        hairColor: m.hairColor,
        eyeColor: m.eyeColor,
        instagram: m.instagram,
        gallery: gallery(m.gallerySeeds),
        submittedById: submitter,
        reviewNote: m.reviewNote,
        reviewedById:
          m.status === ModelStatus.APPROVED || m.status === ModelStatus.REJECTED
            ? moderator.id
            : undefined,
        reviewedAt:
          m.status === ModelStatus.APPROVED || m.status === ModelStatus.REJECTED
            ? new Date()
            : undefined,
      },
    });

    const reviews = REVIEWS[slug] ?? [];
    for (const r of reviews) {
      await prisma.review.create({
        data: {
          modelId: created.id,
          authorId: authorMap[r.by],
          rating: r.rating,
          title: r.title,
          body: r.body,
        },
      });
    }

    if (reviews.length) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await prisma.model.update({
        where: { id: created.id },
        data: {
          ratingAvg: Math.round(avg * 10) / 10,
          ratingCount: reviews.length,
        },
      });
    }
  }

  const counts = {
    admins: await prisma.admin.count(),
    users: await prisma.user.count(),
    models: await prisma.model.count(),
    reviews: await prisma.review.count(),
    pending: await prisma.model.count({ where: { status: ModelStatus.PENDING } }),
  };

  console.log("✅  Seed complete:", counts);
  console.log("\nAdmin console (/admin/login):");
  console.log(`  Super admin →  ${superAdmin.email} / superadmin1`);
  console.log(`  Moderator   →  ${moderator.email} / moderator1`);
  console.log("\nMember login (/login):");
  console.log("  User        →  user@modelhub.test / password123");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
