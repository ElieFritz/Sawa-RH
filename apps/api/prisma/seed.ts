import { Locale, PrismaClient, UserRole, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const categories = [
  ['Developpement logiciel', 'Software Engineering', 'software-engineering'],
  ['Developpement web', 'Web Development', 'web-development'],
  ['Developpement mobile', 'Mobile Development', 'mobile-development'],
  ['DevOps', 'DevOps', 'devops'],
  ['Infrastructure cloud', 'Cloud Infrastructure', 'cloud-infrastructure'],
  ['Administration reseaux', 'Network Administration', 'network-administration'],
  ['Cybersecurite', 'Cybersecurity', 'cybersecurity'],
  ['Support IT', 'IT Support', 'it-support'],
  ['Qualite logicielle', 'Quality Assurance', 'quality-assurance'],
  ['Gestion de produit', 'Product Management', 'product-management'],
  ['Design produit', 'Product Design', 'product-design'],
  ['Recherche UX', 'UX Research', 'ux-research'],
  ['Design graphique', 'Graphic Design', 'graphic-design'],
  ['Data analyse', 'Data Analysis', 'data-analysis'],
  ['Data engineering', 'Data Engineering', 'data-engineering'],
  ['Data science', 'Data Science', 'data-science'],
  ['IA et machine learning', 'AI and Machine Learning', 'ai-machine-learning'],
  ['Business intelligence', 'Business Intelligence', 'business-intelligence'],
  ['Ressources humaines', 'Human Resources', 'human-resources'],
  ['Recrutement', 'Recruitment', 'recruitment'],
  ['Formation', 'Training', 'training'],
  ['Paie et administration RH', 'Payroll and HR Administration', 'payroll-hr-administration'],
  ['Finance', 'Finance', 'finance'],
  ['Comptabilite', 'Accounting', 'accounting'],
  ['Audit', 'Audit', 'audit'],
  ['Controle de gestion', 'Controlling', 'controlling'],
  ['Juridique', 'Legal', 'legal'],
  ['Conformite', 'Compliance', 'compliance'],
  ['Commercial', 'Sales', 'sales'],
  ['Business development', 'Business Development', 'business-development'],
  ['Relation client', 'Customer Success', 'customer-success'],
  ['Support client', 'Customer Support', 'customer-support'],
  ['Marketing digital', 'Digital Marketing', 'digital-marketing'],
  ['Communication', 'Communications', 'communications'],
  ['Creation de contenu', 'Content Creation', 'content-creation'],
  ['Achats', 'Procurement', 'procurement'],
  ['Logistique', 'Logistics', 'logistics'],
  ['Supply chain', 'Supply Chain', 'supply-chain'],
  ['Operations', 'Operations', 'operations'],
  ['Gestion de projet', 'Project Management', 'project-management'],
  ['Assistanat de direction', 'Executive Assistance', 'executive-assistance'],
  ['Sante', 'Healthcare', 'healthcare'],
  ['Soins infirmiers', 'Nursing', 'nursing'],
  ['Pharmacie', 'Pharmacy', 'pharmacy'],
  ['Construction', 'Construction', 'construction'],
  ['Architecture', 'Architecture', 'architecture'],
  ['Immobilier', 'Real Estate', 'real-estate'],
  ['Agriculture', 'Agriculture', 'agriculture'],
  ['Maintenance industrielle', 'Industrial Maintenance', 'industrial-maintenance'],
  ['Production industrielle', 'Manufacturing', 'manufacturing'],
] as const;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@sawa-rh.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      status: 'ACTIVE',
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      status: 'ACTIVE',
      profile: {
        create: {
          fullName: 'SAWA RH Admin',
          locale: Locale.FR,
          completionStatus: 'COMPLETE',
          verificationStatus: VerificationStatus.APPROVED,
          verifiedBadge: true,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  for (const [index, category] of categories.entries()) {
    const [nameFr, nameEn, slug] = category;

    await prisma.jobCategory.upsert({
      where: { slug },
      update: {
        nameFr,
        nameEn,
        isActive: true,
        sortOrder: index + 1,
      },
      create: {
        nameFr,
        nameEn,
        slug,
        isActive: true,
        sortOrder: index + 1,
      },
    });
  }

  console.info('Seed completed', {
    adminId: admin.id,
    adminEmail,
    categoryCount: categories.length,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
