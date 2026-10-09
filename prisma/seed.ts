/**
 * Seed de demonstração do marketplace de fornecedores e do casamento de demonstração.
 * Uso local: `npx prisma db seed` (nunca roda automaticamente em produção).
 */
import "dotenv/config";
import { CurationStatus, PrismaClient, VendorPlanTier } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Perfil das contas de fornecedor: só enxergam o próprio painel (/fornecedor).
const VENDOR_ROLE = { name: "Fornecedor", allowedPaths: ["/fornecedor"] };

// Dados iniciais enriquecidos de parceiros homologados para bootstrapping do marketplace
const DEMO_PARTNERS = [
  {
    companyName: "Villa Sandi Eventos",
    category: "Espaço",
    description: "Espaço campestre com arquitetura contemporânea, lago privativo e capacidade para até 400 convidados em meio à natureza.",
    phone: "(11) 99876-5432",
    whatsapp: "11998765432",
    address: "Estrada dos Nobres, 1200 - São Roque, SP",
    coverUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    ]),
    startingPrice: 1800000, // R$ 18.000,00
    averageTicket: 2400000, // R$ 24.000,00
    priceRange: "$$$$",
    documentType: "CNPJ",
    documentNumber: "45.892.120/0001-94",
    instagram: "@villasandieventos",
    website: "villasandi.com.br",
    rating: 5.0,
    reviewCount: 42,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Campinas e Região"]),
    planTier: VendorPlanTier.MASTER,
    isVerified: true,
    curationStatus: CurationStatus.APPROVED,
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
  {
    companyName: "Gastronomia Fasano & Co",
    category: "Buffet",
    description: "Alta gastronomia para casamentos inesquecíveis. Menus personalizados com cozinha internacional, ilhas temáticas e harmonização de vinhos.",
    phone: "(11) 98765-4321",
    whatsapp: "11987654321",
    address: "Jardins, São Paulo - SP",
    coverUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=200&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    ]),
    startingPrice: 2200000, // R$ 22.000,00
    averageTicket: 3200000, // R$ 32.000,00
    priceRange: "$$$$",
    documentType: "CNPJ",
    documentNumber: "12.345.678/0001-00",
    instagram: "@gastronomiafasano",
    website: "fasanogastronomia.com.br",
    rating: 4.9,
    reviewCount: 38,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Litoral Norte", "Campinas e Região"]),
    planTier: VendorPlanTier.MASTER,
    isVerified: true,
    curationStatus: CurationStatus.APPROVED,
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
  {
    companyName: "Lumière Fotografia & Cinema",
    category: "Fotografia",
    description: "Narrativa documental e poética de casamentos reais. Capturamos a essência, a emoção e a elegância de cada instante.",
    phone: "(11) 97654-3210",
    whatsapp: "11976543210",
    address: "Pinheiros, São Paulo - SP",
    coverUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
    ]),
    startingPrice: 650000, // R$ 6.500,00
    averageTicket: 950000, // R$ 9.500,00
    priceRange: "$$$",
    documentType: "CNPJ",
    documentNumber: "33.987.654/0001-12",
    instagram: "@lumierefotoecinema",
    rating: 5.0,
    reviewCount: 56,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Litoral Norte", "Brasil Todo"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: CurationStatus.APPROVED,
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
  {
    companyName: "Atelier Floral & Décor",
    category: "Decoração",
    description: "Cenografia exclusiva e projetos botânicos sob medida. Criamos ambientes imersivos com flores nobres e iluminação cênica.",
    phone: "(11) 96543-2109",
    whatsapp: "11965432109",
    coverUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
    ]),
    startingPrice: 1200000, // R$ 12.000,00
    averageTicket: 1600000, // R$ 16.000,00
    priceRange: "$$$",
    documentType: "CNPJ",
    documentNumber: "88.765.432/0001-55",
    instagram: "@atelierfloraldecor",
    rating: 4.8,
    reviewCount: 29,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Campinas e Região"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: CurationStatus.APPROVED,
    offersOnlineMeet: true,
    hasPhysicalSpace: false,
  },
  {
    companyName: "Som & Luz Live Band",
    category: "DJ & Som",
    description: "Pista cheia do início ao fim! DJs conceituados, músicos ao vivo, sax lounge para recepção e estrutura de som e iluminação premium.",
    phone: "(11) 95432-1098",
    whatsapp: "11954321098",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    startingPrice: 450000, // R$ 4.500,00
    averageTicket: 680000, // R$ 6.800,00
    priceRange: "$$",
    documentType: "CPF",
    documentNumber: "123.456.789-00",
    instagram: "@someluzliveband",
    rating: 4.9,
    reviewCount: 45,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Litoral Norte"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: CurationStatus.APPROVED,
    offersOnlineMeet: true,
    hasPhysicalSpace: false,
  },
  {
    companyName: "Maison Blanche Haute Couture",
    category: "Vestidos",
    description: "Vestidos de noiva sob medida e coleções exclusivas europeias. Caimento perfeito, rendas francesas e atendimento privativo com estilista.",
    phone: "(11) 94321-0987",
    whatsapp: "11943210987",
    address: "Itaim Bibi, São Paulo - SP",
    coverUrl: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1200&q=80",
    startingPrice: 850000, // R$ 8.500,00
    averageTicket: 1400000, // R$ 14.000,00
    priceRange: "$$$",
    documentType: "CNPJ",
    documentNumber: "77.654.321/0001-33",
    instagram: "@maisonblanchehautecouture",
    website: "maisonblanche.com.br",
    rating: 5.0,
    reviewCount: 31,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Campinas e Região", "Brasil Todo"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: CurationStatus.APPROVED,
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
  {
    companyName: "Dolce & Confeito Ateliê",
    category: "Doces & Bolo",
    description: "Doces finos artesanais, bem-casados premiados e bolos cenográficos e de corte com acabamento impecável e sabores inesquecíveis.",
    phone: "(11) 93210-9876",
    whatsapp: "11932109876",
    address: "Moema, São Paulo - SP",
    coverUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1200&q=80",
    startingPrice: 220000, // R$ 2.200,00
    averageTicket: 380000, // R$ 3.800,00
    priceRange: "$",
    documentType: "CNPJ",
    documentNumber: "99.123.456/0001-77",
    instagram: "@dolceconfeitoatelie",
    rating: 4.9,
    reviewCount: 52,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: CurationStatus.APPROVED,
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
];

// Casamento de demonstração: todo dado do painel do casal pertence a um casamento (weddingId).
const DEMO_WEDDING = { slug: "lucas-e-giovanna", coupleNames: "Lucas & Giovanna" };

/** Reusa o casamento principal (o mais antigo) ou cria o de demonstração, com as linhas únicas dele. */
async function ensureDemoWedding(prisma: PrismaClient) {
  let wedding = await prisma.wedding.findFirst({ orderBy: { createdAt: "asc" } });
  if (!wedding) {
    wedding = await prisma.wedding.create({ data: DEMO_WEDDING });
    console.log(`Casamento de demonstração "${wedding.coupleNames}" criado (/casamento/${wedding.slug}).`);
  } else {
    console.log(`Casamento "${wedding.coupleNames}" reaproveitado (/casamento/${wedding.slug}).`);
  }

  const weddingId = wedding.id;
  await prisma.systemSettings.upsert({
    where: { weddingId },
    update: {},
    create: { weddingId, themeColor: "#18181b", welcomeText: "Bem-vindos ao nosso casamento!" },
  });
  await prisma.walletBalance.upsert({ where: { weddingId }, update: {}, create: { weddingId, balance: 0 } });
  await prisma.siteCustomization.upsert({
    where: { weddingId },
    update: {},
    create: { weddingId, slug: wedding.slug, title: wedding.coupleNames, themeColor: wedding.themeColor },
  });

  // Modelos de mensagem padrão do casamento (os mesmos que o painel cria no primeiro acesso)
  const buttons = JSON.stringify([
    { id: "confirm", text: "✅ Confirmar Presença" },
    { id: "decline", text: "❌ Não poderei ir" },
  ]);
  const templates = [
    {
      name: "Convite Inicial (Com Botões RSVP)",
      type: "INITIAL_INVITE",
      content:
        "💍 *Você está convidado!*\n\nOlá, *{nome}*! 🎉\n\nTemos a honra de convidá-lo(a) para o nosso casamento!\n\nPor favor, confirme sua presença clicando no botão abaixo:",
    },
    {
      name: "Lembrete de RSVP Pendente",
      type: "RSVP_REMINDER",
      content:
        "🔔 *Lembrete de Presença*\n\nOlá, *{nome}*! Tudo bem? 😊\n\nPercebemos que ainda não recebemos a sua confirmação para o nosso casamento.\n\nPor favor, confirme pelo botão abaixo:",
    },
  ];
  for (const template of templates) {
    const exists = await prisma.messageTemplate.findFirst({ where: { weddingId, type: template.type }, select: { id: true } });
    if (!exists) await prisma.messageTemplate.create({ data: { ...template, buttons, weddingId } });
  }

  return wedding;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const count = await prisma.partnerVendor.count();
  if (count > 0) {
    console.log(`Marketplace já possui ${count} fornecedores; seed ignorado.`);
  } else {
    for (const partner of DEMO_PARTNERS) {
      await prisma.partnerVendor.create({ data: partner });
    }
    console.log(`${DEMO_PARTNERS.length} fornecedores de demonstração criados.`);
  }

  await ensureDemoWedding(prisma);

  // Perfil "Fornecedor": cria se não existir, sem sobrescrever ajustes feitos pelo admin.
  const vendorRole = await prisma.role.upsert({
    where: { name: VENDOR_ROLE.name },
    update: {},
    create: VENDOR_ROLE,
  });
  console.log(`Perfil "${vendorRole.name}" disponível.`);

  // Login de demonstração do painel do fornecedor (opcional): só com senha definida no ambiente,
  // para nunca criar credenciais conhecidas. Vincula ao primeiro fornecedor de demonstração.
  const demoVendorUsername = process.env.SEED_VENDOR_USERNAME?.trim();
  const demoVendorPassword = process.env.SEED_VENDOR_PASSWORD;
  if (demoVendorUsername && demoVendorPassword && demoVendorPassword.length >= 8) {
    const partner = await prisma.partnerVendor.findFirst({
      where: { companyName: DEMO_PARTNERS[0].companyName },
      select: { id: true, companyName: true, user: { select: { id: true } } },
    });
    const existing = await prisma.user.findUnique({ where: { username: demoVendorUsername }, select: { id: true } });
    if (!partner) {
      console.log("Fornecedor de demonstração não encontrado; login de fornecedor ignorado.");
    } else if (existing || partner.user) {
      console.log("Login de fornecedor de demonstração já existe; ignorado.");
    } else {
      await prisma.user.create({
        data: {
          name: partner.companyName,
          username: demoVendorUsername,
          password: await bcrypt.hash(demoVendorPassword, 10),
          roleId: vendorRole.id,
          partnerVendorId: partner.id,
        },
      });
      console.log(`Login "${demoVendorUsername}" vinculado a ${partner.companyName}.`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
