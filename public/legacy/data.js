const Qs = {
  quant: [
    { q: "A train travels 360 km at 90 km/h. How long does the journey take?", opts: ["3 hours", "4 hours", "3.5 hours", "4.5 hours"], ans: 1, exp: "Time = Distance ÷ Speed = 360 ÷ 90 = 4 hours. Always divide distance by speed and check units carefully." },
    { q: "8 workers complete a job in 6 days. How many days will 12 workers take?", opts: ["4 days", "3 days", "5 days", "2 days"], ans: 0, exp: "Total work = 8×6 = 48 man-days. Time for 12 workers = 48÷12 = 4 days. Classic inverse proportion." },
    { q: "A shopkeeper sells at 20% profit. Cost price is ₹250. What is selling price?", opts: ["₹280", "₹300", "₹290", "₹310"], ans: 1, exp: "SP = CP × (1 + Profit%) = 250 × 1.2 = ₹300." },
    { q: "Ratio of two numbers is 3:5 and their sum is 64. What is the larger?", opts: ["24", "40", "32", "48"], ans: 1, exp: "3x + 5x = 64 → x = 8. Larger = 5×8 = 40." },
    { q: "Pipe fills tank in 8h, another drains in 12h. Net fill time both open?", opts: ["24 hours", "20 hours", "16 hours", "18 hours"], ans: 0, exp: "Net rate = 1/8 − 1/12 = 1/24 per hour. Time = 24 hours." },
  ],
  logical: [
    { q: "All cats are animals. Some animals are wild. Which conclusion follows?", opts: ["Some cats are wild", "All animals are cats", "Some cats may be wild", "No cats are wild"], ans: 2, exp: "Since some animals are wild and all cats are animals, some cats may be wild — not certain, but possible." },
    { q: "In a code, MANGO = NBOHP. What does GUAVA equal?", opts: ["HVBWB", "HVBVB", "FTVZU", "HVBXB"], ans: 0, exp: "Each letter shifts +1. G→H, U→V, A→B, V→W, A→B = HVBWB." },
    { q: "P is taller than Q. Q taller than R. S shorter than P but taller than Q. Who is tallest?", opts: ["P", "Q", "R", "S"], ans: 0, exp: "Order: P > S > Q > R. P is the tallest." },
  ],
  verbal: [
    { q: "Choose the word closest in meaning to ELOQUENT:", opts: ["Silent", "Articulate", "Confused", "Rude"], ans: 1, exp: "Eloquent means having fluent, forceful speech. Articulate is the closest synonym." },
    { q: "Fill in: Despite the heavy rain, the event _____ as planned.", opts: ["proceeded", "receded", "conceded", "seceded"], ans: 0, exp: "Proceeded means continued forward — the event continued despite the rain." },
    { q: "Identify the error: 'She don't know where is the office'", opts: ["She don't", "know where", "is the office", "No error"], ans: 0, exp: "Correct form is 'She doesn't' — third person singular requires 'does not'." },
  ],
  di: [
    { q: "Bar chart: Jan=₹40k, Feb=₹55k, Mar=₹48k. Average monthly sales?", opts: ["₹46k", "₹47.67k", "₹48k", "₹45k"], ans: 1, exp: "Average = (40+55+48)÷3 = 143÷3 = ₹47.67k." },
    { q: "Pie chart: IT=40%, Finance=30%, Retail=20%, Others=10%. 500 employees. Finance count?", opts: ["150", "200", "100", "120"], ans: 0, exp: "Finance = 30% of 500 = 0.30 × 500 = 150." },
  ]
};

const MNCs = [
  { name: "Tata Consultancy Services", short: "TCS", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/320px-Tata_Consultancy_Services_Logo.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=tataconsultancyservices.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="TCS">`, secs: 4, time: 90, qs: 82, qb: "800+", note: "Negative: -0.33" },
  { name: "Infosys", short: "INF", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/320px-Infosys_logo.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=infosys.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="INF">`, secs: 3, time: 95, qs: 60, qb: "600+", note: "No negative marking" },
  { name: "Wipro", short: "WIP", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Wipro_Primary_Logo_Color_RGB.svg/320px-Wipro_Primary_Logo_Color_RGB.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=wipro.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="WIP">`, secs: 3, time: 60, qs: 55, qb: "500+", note: "Essay round" },
  { name: "HCL Technologies", short: "HCL", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/HCL_Technologies_logo.svg/320px-HCL_Technologies_logo.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=hcltechnologies.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="HCL">`, secs: 4, time: 75, qs: 70, qb: "450+", note: "" },
  { name: "Cognizant", short: "CTS", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Cognizant_logo.svg/320px-Cognizant_logo.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=cognizant.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="CTS">`, secs: 3, time: 75, qs: 65, qb: "550+", note: "" },
  { name: "Accenture", short: "ACC", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Accenture.svg/320px-Accenture.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=accenture.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="ACC">`, secs: 4, time: 90, qs: 75, qb: "500+", note: "" },
  { name: "Microsoft India", short: "MSFT", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/320px-Microsoft_logo_%282012%29.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=microsoftindia.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="MSFT">`, secs: 3, time: 80, qs: 60, qb: "400+", note: "Engineering" },
  { name: "Amazon India", short: "AMZ", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=amazonindia.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="AMZ">`, secs: 3, time: 70, qs: 55, qb: "350+", note: "LP focus" },
  { name: "Google India", short: "GOO", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=googleindia.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="GOO">`, secs: 3, time: 90, qs: 50, qb: "300+", note: "Googliness" },
  { name: "Tech Mahindra", short: "TM", logo: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Tech_Mahindra_New_Logo.svg/320px-Tech_Mahindra_New_Logo.svg.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=techmahindra.com&sz=128'" style="width:40px;height:40px;object-fit:contain" alt="TM">`, secs: 4, time: 60, qs: 60, qb: "400+", note: "" }
];

const MNCQs = [
  { q: "Pipe fills in 8h, another drains in 12h. Net fill time?", opts: ["24 hours", "20 hours", "16 hours", "18 hours"], ans: 0, exp: "Net rate = 1/8−1/12 = 1/24. Time = 24 hours." },
  { q: "GDP grew 7.2% in Q3 vs 6.8% in Q2. Increase in growth rate?", opts: ["0.4%", "0.3%", "0.5%", "0.6%"], ans: 0, exp: "7.2%−6.8% = 0.4 percentage points." },
  { q: "She _____ working here since 2020.", opts: ["is", "was", "has been", "had been"], ans: 2, exp: "'Has been' for an action started in the past continuing to now." },
  { q: "Two numbers ratio 3:5, HCF is 8. What is LCM?", opts: ["120", "160", "240", "80"], ans: 0, exp: "Numbers: 24 and 40. LCM = 24×40÷8 = 120." },
  { q: "Bar chart shows Q1=₹2L, Q2=₹2.4L, Q3=₹2.2L. Average quarterly revenue?", opts: ["₹2.2L", "₹2.19L", "₹2.15L", "₹2.3L"], ans: 0, exp: "(2+2.4+2.2)÷3 = 6.6÷3 = ₹2.2L." },
];

const ivQs = [
  {
    q: "Tell me about yourself and why you want to join this company.", sugs: [
      { t: "Start with your education, then highlight a key technical or academic achievement", c: "green" },
      { t: "Quantify your accomplishments — use numbers, percentages, or rankings", c: "amber" },
      { t: "Keywords: analytical, data-driven, problem-solving, collaborative", c: "accent" }
    ]
  },
  {
    q: "Describe a technical challenge you solved. Walk me through your approach.", sugs: [
      { t: "Use STAR: Situation → Task → Action → Result", c: "green" },
      { t: "Quantify the outcome — e.g. 'reduced processing time by 40%'", c: "amber" },
      { t: "Keywords: systematic, root cause analysis, scalable, debugging", c: "accent" }
    ]
  },
  {
    q: "Where do you see yourself in 5 years?", sugs: [
      { t: "Align your 5-year goal with the company's growth areas and your target role", c: "green" },
      { t: "Be specific about the domain — mention a technology stack or function", c: "amber" }
    ]
  },
  {
    q: "What are your greatest strengths relevant to this role?", sugs: [
      { t: "Give concrete evidence — mention a project, result, or measurable achievement", c: "green" },
      { t: "Give at least 2 examples — one technical, one behavioural or leadership", c: "amber" }
    ]
  },
  {
    q: "Why should we hire you over other candidates?", sugs: [
      { t: "Highlight a unique combination of skills or experience that others may lack", c: "green" },
      { t: "Keywords: consistent improvement, adaptable, fast learner, results-oriented", c: "accent" }
    ]
  },
  {
    q: "Tell me about a time you worked under pressure or a tight deadline.", sugs: [
      { t: "Use STAR framework — be specific about your individual contribution", c: "green" },
      { t: "Show resilience: how you prioritised tasks and managed your time", c: "amber" },
      { t: "Keywords: time management, prioritisation, composure, delivery", c: "accent" }
    ]
  },
  {
    q: "How do you handle disagreements with a teammate or manager?", sugs: [
      { t: "Show maturity — focus on listening and finding common ground", c: "green" },
      { t: "Give a real example where the outcome was positive for the team", c: "amber" },
      { t: "Keywords: empathy, communication, constructive, professional", c: "accent" }
    ]
  },
  {
    q: "Describe a project you're most proud of. What was your role?", sugs: [
      { t: "Choose a project with measurable impact — make it relevant to this role", c: "green" },
      { t: "Clearly state your individual contribution vs the team's contribution", c: "amber" },
      { t: "Keywords: ownership, initiative, end-to-end, impact, shipped", c: "accent" }
    ]
  },
  {
    q: "How do you stay updated with the latest trends in your field?", sugs: [
      { t: "Mention specific resources — blogs, courses, communities, open source", c: "green" },
      { t: "Give an example of something you learned recently and applied", c: "amber" }
    ]
  },
  {
    q: "Tell me about a time you failed. What did you learn from it?", sugs: [
      { t: "Choose a genuine failure — interviewers value self-awareness over perfection", c: "green" },
      { t: "Focus more on what you learned and changed afterwards than the failure itself", c: "amber" },
      { t: "Keywords: accountability, growth mindset, reflection, improvement", c: "accent" }
    ]
  },
  {
    q: "How do you prioritise tasks when you have multiple deadlines?", sugs: [
      { t: "Mention a specific framework — MoSCoW, Eisenhower matrix, or your own method", c: "green" },
      { t: "Give an example: describe the competing tasks and how you resolved them", c: "amber" },
      { t: "Keywords: prioritisation, structured, proactive, communication", c: "accent" }
    ]
  },
  {
    q: "What motivates you to do your best work?", sugs: [
      { t: "Be authentic — link your motivation to the role and company mission", c: "green" },
      { t: "Avoid generic answers; tie it to a real experience or passion", c: "amber" }
    ]
  },
  {
    q: "Describe your experience working in a team environment.", sugs: [
      { t: "Highlight a specific collaborative project — mention your role clearly", c: "green" },
      { t: "Mention how you handled different working styles or conflicts", c: "amber" },
      { t: "Keywords: cross-functional, communication, shared ownership, outcome", c: "accent" }
    ]
  },
  {
    q: "How would you explain a complex technical concept to a non-technical person?", sugs: [
      { t: "Use an analogy or real-world example to simplify the concept", c: "green" },
      { t: "Show patience and adaptability — mention checking for understanding", c: "amber" },
      { t: "Keywords: clarity, simplification, audience awareness, communication", c: "accent" }
    ]
  },
  {
    q: "Do you have any questions for us?", sugs: [
      { t: "Always ask 1-2 thoughtful questions — shows genuine interest in the role", c: "green" },
      { t: "Good questions: growth path in the team, current tech challenges, team culture", c: "amber" },
      { t: "Avoid asking about salary or leaves in the first interview", c: "accent" }
    ]
  },
];

const jobRoles = [
  // ── Tech / Engineering ──
  { n: "Full Stack", cat: "tech", icon: "code", q: 320 },
  { n: "Frontend", cat: "tech", icon: "monitor", q: 210 },
  { n: "Backend", cat: "tech", icon: "server", q: 240 },
  { n: "React Dev", cat: "tech", icon: "atom", q: 180 },
  { n: "Node.js", cat: "tech", icon: "node", q: 150 },
  { n: "Python", cat: "tech", icon: "python", q: 195 },
  { n: "Java Dev", cat: "tech", icon: "java", q: 220 },
  { n: "Android", cat: "tech", icon: "mobile", q: 160 },
  { n: "iOS Dev", cat: "tech", icon: "apple", q: 140 },
  { n: "Flutter", cat: "tech", icon: "flutter", q: 130 },
  { n: "UI/UX", cat: "tech", icon: "design", q: 170 },
  { n: "DevOps", cat: "tech", icon: "devops", q: 145 },
  { n: "Data Analyst", cat: "tech", icon: "chart", q: 200 },
  { n: "Data Scientist", cat: "tech", icon: "science", q: 190 },
  { n: "ML Engineer", cat: "tech", icon: "ai", q: 175 },
  { n: "Cloud AWS", cat: "tech", icon: "cloud", q: 165 },
  { n: "Cloud Azure", cat: "tech", icon: "azure", q: 140 },
  { n: "Cybersecurity", cat: "tech", icon: "shield", q: 155 },
  { n: "QA Engineer", cat: "tech", icon: "qa", q: 120 },
  { n: "Product Mgr", cat: "tech", icon: "product", q: 135 },
  { n: "Biz Analyst", cat: "tech", icon: "biz", q: 115 },
  { n: "Blockchain", cat: "tech", icon: "chain", q: 100 },
  { n: "Game Dev", cat: "tech", icon: "game", q: 95 },
  { n: "Embedded", cat: "tech", icon: "chip", q: 110 },
  { n: "API Eng", cat: "tech", icon: "api", q: 125 },
  { n: "DB Admin", cat: "tech", icon: "db", q: 108 },
  { n: "Sys Design", cat: "tech", icon: "sysdes", q: 145 },
  { n: "Network Eng", cat: "tech", icon: "network", q: 118 },
  { n: "Tech Support", cat: "tech", icon: "support", q: 90 },
  // ── Commerce / Finance / Management ──
  { n: "Accountant", cat: "commerce", icon: "acc", q: 180 },
  { n: "Finance Analyst", cat: "commerce", icon: "fin", q: 210 },
  { n: "Investment Banker", cat: "commerce", icon: "bank", q: 195 },
  { n: "CA / CPA", cat: "commerce", icon: "ca", q: 220 },
  { n: "Tax Consultant", cat: "commerce", icon: "tax", q: 160 },
  { n: "Audit Associate", cat: "commerce", icon: "audit", q: 155 },
  { n: "Financial Planner", cat: "commerce", icon: "plan", q: 145 },
  { n: "Risk Analyst", cat: "commerce", icon: "risk", q: 170 },
  { n: "Equity Analyst", cat: "commerce", icon: "equity", q: 165 },
  { n: "Credit Analyst", cat: "commerce", icon: "credit", q: 150 },
  { n: "Supply Chain", cat: "commerce", icon: "supply", q: 140 },
  { n: "Operations Mgr", cat: "commerce", icon: "ops", q: 135 },
  { n: "HR Manager", cat: "commerce", icon: "hr", q: 125 },
  { n: "Marketing Mgr", cat: "commerce", icon: "mktg", q: 130 },
  { n: "Sales Executive", cat: "commerce", icon: "sales", q: 115 },
  { n: "Logistics", cat: "commerce", icon: "logis", q: 110 },
  { n: "Banking Ops", cat: "commerce", icon: "bankop", q: 160 },
  { n: "Insurance", cat: "commerce", icon: "insur", q: 145 },
  { n: "Actuary", cat: "commerce", icon: "act", q: 175 },
  { n: "Custom Role", cat: "other", icon: "custom", q: "∞" },
];

const colleges = [
  { name: "PSG College of Technology", code: "PSG-COIM-2024", students: 142, enabled: true },
  { name: "Anna University", code: "ANNA-CHN-2024", students: 89, enabled: true },
  { name: "CIT Coimbatore", code: "CIT-COIM-2024", students: 0, enabled: false },
  { name: "SASTRA Deemed University", code: "SASTRA-TJR-2024", students: 56, enabled: false },
];

