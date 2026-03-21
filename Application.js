// utils/seed.js
// Run with: node utils/seed.js
// Seeds the database with real opportunities and a test admin user

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/opportuniq';

const seedOpportunities = [
  {
    title: 'SEBI Young Professional Program 2026',
    company: 'Securities and Exchange Board of India',
    type: 'internship',
    tags: ['internship', 'govt'],
    skillsRequired: ['Finance', 'Economics', 'Law', 'Policy'],
    eligibleBranches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'Other'],
    eligibleYears: ['4th Year', '3rd Year'],
    minCGPA: 6.5,
    deadline: new Date('2026-03-31'),
    deadlineDisplay: 'Mar 31, 2026',
    stipend: 'Rs 70,000 per month',
    description: '91 vacancies open at SEBI. Work on financial market regulation, policy drafting, and investor protection in Mumbai. One of the highest-paid government internship opportunities in India.',
    eligibility: 'Fresh graduates or postgraduates in Finance, Law, Economics or related fields',
    applyUrl: 'https://sebi.gov.in',
    source: 'sebi.gov.in',
    emoji: '📈',
    bgColor: '#b45309'
  },
  {
    title: 'DPIIT Summer Internship 2026',
    company: 'Ministry of Commerce (DPIIT)',
    type: 'internship',
    tags: ['internship', 'govt'],
    skillsRequired: ['Policy', 'Management', 'Communication', 'Research'],
    eligibleBranches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'Other'],
    eligibleYears: ['2nd Year', '3rd Year', '4th Year'],
    minCGPA: 6.0,
    deadline: new Date('2026-03-31'),
    deadlineDisplay: 'Mar 31, 2026',
    stipend: 'Rs 20,000 per month',
    description: 'Department for Promotion of Industry and Internal Trade internship. Work on startup ecosystem policy, investment promotion, and industry analysis in New Delhi.',
    eligibility: '2nd or 3rd year UG or PG students, any discipline, Indian citizen',
    applyUrl: 'https://dpiit.gov.in',
    source: 'dpiit.gov.in',
    emoji: '⚖️',
    bgColor: '#065f46'
  },
  {
    title: 'Kotak Mahindra Bank HR Internship 2026',
    company: 'Kotak Mahindra Bank',
    type: 'internship',
    tags: ['internship'],
    skillsRequired: ['HR', 'Communication', 'Excel', 'Recruitment', 'Teamwork'],
    eligibleBranches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'Other'],
    eligibleYears: ['2nd Year', '3rd Year', '4th Year'],
    minCGPA: 6.0,
    deadline: new Date('2026-04-13'),
    deadlineDisplay: 'Apr 13, 2026',
    stipend: 'Rs 12,000 per month',
    description: 'Prestigious HR internship at Kotak Mahindra Bank focused on talent acquisition and recruitment. Based in Mumbai. Strong brand name and real corporate HR experience.',
    eligibility: 'Any UG student; fresh graduates welcome; age 18 to 25',
    applyUrl: 'https://careers.kotak.com',
    source: 'kotak.com/careers',
    emoji: '🏦',
    bgColor: '#c2410c'
  },
  {
    title: 'GE Appliances Technology Intern 2026',
    company: 'GE Appliances (Haier Company)',
    type: 'internship',
    tags: ['internship', 'remote'],
    skillsRequired: ['Python', 'Cloud', 'Web Development', 'Node.js', 'React', 'DevOps'],
    eligibleBranches: ['CSE', 'IT'],
    eligibleYears: ['3rd Year', '4th Year'],
    minCGPA: 7.0,
    deadline: new Date('2026-04-30'),
    deadlineDisplay: 'Apr 30, 2026',
    stipend: 'Rs 30,000 to 60,000 per month',
    description: 'GE Appliances is hiring Technology Interns across Hyderabad and Bengaluru. Work on web, mobile, and cloud applications. Exposure to cloud infrastructure, AI technologies, and automation. Duration 20 to 24 weeks.',
    eligibility: 'B.Tech or BE in Computer Science or IT, 3rd or 4th year',
    applyUrl: 'https://careers.geappliances.com',
    source: 'placement-officer.com',
    emoji: '⚙️',
    bgColor: '#1e40af'
  },
  {
    title: 'IBM Internship 2026 — AI and Cloud Roles',
    company: 'IBM India',
    type: 'internship',
    tags: ['internship', 'remote'],
    skillsRequired: ['Python', 'Machine Learning', 'Cloud', 'Data Science', 'Java'],
    eligibleBranches: ['CSE', 'IT', 'ECE'],
    eligibleYears: ['2nd Year', '3rd Year', '4th Year'],
    minCGPA: 7.0,
    deadline: new Date('2026-04-30'),
    deadlineDisplay: 'Apr 30, 2026',
    stipend: 'Paid — Competitive',
    description: 'IBM opened 2026 internship programs across India. Roles in AI, Cloud Computing, Data Science, Cybersecurity, and Software Development. No prior experience needed. Interns work on live IBM projects with global teams.',
    eligibility: 'UG or PG pursuing Bachelor or Master degree',
    applyUrl: 'https://ibm.com/careers',
    source: 'ibm.com/careers',
    emoji: '💙',
    bgColor: '#1e3a8a'
  },
  {
    title: 'TCS Research Internship 2026',
    company: 'Tata Consultancy Services',
    type: 'research',
    tags: ['research', 'internship'],
    skillsRequired: ['Machine Learning', 'Python', 'Research', 'Data Analysis', 'Statistics'],
    eligibleBranches: ['CSE', 'IT', 'ECE'],
    eligibleYears: ['4th Year'],
    minCGPA: 7.5,
    deadline: new Date('2026-04-30'),
    deadlineDisplay: 'Apr 30, 2026',
    stipend: 'Paid as per TCS norms',
    description: 'TCS invites final-year BE, BTech, MTech, MS and PhD students for research internships. Duration 6 to 18 weeks. Work on industry-scale research problems with world-class TCS researchers.',
    eligibility: 'Final year BE, BTech, MTech, MS or PhD with strong academic record',
    applyUrl: 'https://tcs.com/careers/india/internship',
    source: 'tcs.com/careers',
    emoji: '🧪',
    bgColor: '#0f766e'
  },
  {
    title: 'Inlaks Scholarship 2026',
    company: 'Inlaks Shivdasani Foundation',
    type: 'scholarship',
    tags: ['scholarship'],
    skillsRequired: ['Leadership', 'Research', 'Communication'],
    eligibleBranches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'Other'],
    eligibleYears: ['4th Year'],
    minCGPA: 6.8,
    deadline: new Date('2026-03-31'),
    deadlineDisplay: 'Mar 31, 2026',
    stipend: 'Up to USD 1,00,000',
    description: 'Prestigious international award for outstanding Indian students pursuing postgraduate education at top UK, US, and European universities. Covers tuition, living expenses, travel, visa, and health allowance.',
    eligibility: 'Indian passport holder; CGPA above 6.8 out of 10; for PG abroad admission',
    applyUrl: 'https://inlaksfoundation.org/opportunities/scholarship/',
    source: 'inlaksfoundation.org',
    emoji: '🎓',
    bgColor: '#7c3aed'
  },
  {
    title: 'K.C. Mahindra Scholarship 2026',
    company: 'K.C. Mahindra Education Trust',
    type: 'scholarship',
    tags: ['scholarship'],
    skillsRequired: ['Leadership', 'Communication'],
    eligibleBranches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'Other'],
    eligibleYears: ['4th Year'],
    minCGPA: 6.5,
    deadline: new Date('2026-03-31'),
    deadlineDisplay: 'Mar 31, 2026',
    stipend: 'Up to Rs 10 Lakhs interest-free',
    description: 'Interest-free loan scholarship for Indian students pursuing postgraduate studies abroad. Top 3 scholars receive Rs 10L each; remaining successful candidates Rs 5L each.',
    eligibility: 'Indian citizens with First-Class UG degree and admission to a reputed international university',
    applyUrl: 'https://kcmet.org',
    source: 'kcmet.org',
    emoji: '🏅',
    bgColor: '#7c2d12'
  },
  {
    title: 'GREAT Scholarship 2026 — Study in UK',
    company: 'British Council and UK Government',
    type: 'scholarship',
    tags: ['scholarship'],
    skillsRequired: ['IELTS', 'Research', 'Leadership'],
    eligibleBranches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'Other'],
    eligibleYears: ['4th Year'],
    minCGPA: 7.0,
    deadline: new Date('2026-06-30'),
    deadlineDisplay: 'Jun 30, 2026',
    stipend: 'Full tuition for 1-year PG',
    description: 'Covers full tuition for one-year postgraduate courses at 20 participating UK universities. One of the most accessible UK scholarships for Indian students, managed by the British Council.',
    eligibility: 'Indian students with an offer from a participating UK university; IELTS required',
    applyUrl: 'https://study-uk.britishcouncil.org',
    source: 'britishcouncil.org',
    emoji: '🇬🇧',
    bgColor: '#1e3a5f'
  },
  {
    title: 'BuildWithAI Hackathon — Presidency University',
    company: 'Presidency University Bengaluru',
    type: 'hackathon',
    tags: ['hackathon'],
    skillsRequired: ['Machine Learning', 'Web Development', 'Python', 'React', 'Innovation'],
    eligibleBranches: ['CSE', 'IT', 'ECE'],
    eligibleYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    minCGPA: 0,
    deadline: new Date('2026-03-25'),
    deadlineDisplay: 'Mar 25, 2026',
    stipend: 'Prizes plus certificates',
    description: '24-hour offline hackathon at Presidency University Bengaluru. Teams develop a Minimum Viable Product — web app, mobile app, or intelligent system. Real-world AI impact focus.',
    eligibility: 'Open to all college students; teams of 2 to 4 members encouraged',
    applyUrl: 'https://presidencyuniversity.in',
    source: 'presidencyuniversity.in',
    emoji: '🤖',
    bgColor: '#7c3aed'
  },
  {
    title: 'Imperial India Future Leaders 2026',
    company: 'Imperial College London',
    type: 'scholarship',
    tags: ['scholarship'],
    skillsRequired: ['Research', 'Leadership', 'IELTS'],
    eligibleBranches: ['CSE', 'IT', 'ECE', 'MECH'],
    eligibleYears: ['4th Year'],
    minCGPA: 8.0,
    deadline: new Date('2026-04-06'),
    deadlineDisplay: 'Apr 6, 2026',
    stipend: 'Partial tuition support',
    description: 'Scholarship for outstanding Indian STEM students at Imperial College London. Assessed on academic excellence, research potential, and leadership qualities.',
    eligibility: 'Indian students with admission offer from Imperial in Engineering or Natural Sciences',
    applyUrl: 'https://imperial.ac.uk/fees-and-funding/scholarships',
    source: 'imperial.ac.uk',
    emoji: '🔬',
    bgColor: '#374151'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Opportunity.deleteMany({});
    await User.deleteMany({ role: 'admin' });
    console.log('Cleared existing data');

    // Insert opportunities
    const opps = await Opportunity.insertMany(seedOpportunities);
    console.log(`Inserted ${opps.length} opportunities`);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@opportuniq.com',
      password: 'admin123456',
      role: 'admin',
      branch: 'CSE',
      year: '4th Year',
      skills: ['Management', 'Policy']
    });
    console.log(`Admin created: ${admin.email} / admin123456`);

    // Create a test student
    const student = await User.create({
      name: 'Arjun Reddy',
      email: 'arjun@student.com',
      password: 'student123',
      role: 'student',
      branch: 'CSE',
      year: '3rd Year',
      cgpa: 8.4,
      skills: ['Python', 'React', 'Machine Learning', 'SQL', 'Node.js'],
      interests: 'AI/ML, Web Dev, Open Source'
    });
    console.log(`Student created: ${student.email} / student123`);

    console.log('\nSeed complete!');
    console.log('Admin login:   admin@opportuniq.com  /  admin123456');
    console.log('Student login: arjun@student.com     /  student123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
