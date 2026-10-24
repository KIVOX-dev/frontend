// Suggestion lists for type-ahead fields (work experience, etc). They only
// suggest — a value that isn't listed can always be typed in.
import { COMPANY_OPTIONS } from "@/components/shared/CompanyPicker";

export const JOB_TITLE_SUGGESTIONS: readonly string[] = [
  "Software Engineer", "Software Developer", "Senior Software Engineer", "Associate Software Engineer", "Software Engineer Intern",
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "Web Developer", "Mobile App Developer",
  "Android Developer", "iOS Developer", "React Developer", "Node.js Developer", "Java Developer", "Python Developer",
  ".NET Developer", "PHP Developer", "Flutter Developer", "Game Developer", "Blockchain Developer",
  "Data Analyst", "Data Scientist", "Data Engineer", "Business Analyst", "Business Intelligence Analyst", "Machine Learning Engineer",
  "AI Engineer", "AI / ML Engineer", "Computer Vision Engineer", "NLP Engineer", "Research Intern",
  "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "System Administrator", "Network Engineer",
  "QA Engineer", "Test Engineer", "Automation Test Engineer", "Manual Tester", "Cybersecurity Analyst", "Penetration Tester",
  "UI/UX Designer", "Graphic Designer", "Product Designer", "Video Editor", "Content Writer", "Content Creator",
  "Technical Writer", "Digital Marketing Executive", "SEO Specialist", "Social Media Manager", "Marketing Manager",
  "Product Manager", "Project Manager", "Program Manager", "Scrum Master", "Technical Support Engineer", "Customer Support Executive",
  "Sales Executive", "Business Development Executive", "Account Manager", "Relationship Manager",
  "HR Executive", "Talent Acquisition Specialist", "Recruiter", "Operations Executive",
  "Financial Analyst", "Accountant", "Auditor", "Teaching Assistant", "Lecturer", "Embedded Engineer", "IoT Engineer",
  "Intern", "Trainee", "Freelancer",
];

// Indian cities and tech hubs first (this is a campus-placement product),
// plus the common remote option and a few international hubs.
export const LOCATION_SUGGESTIONS: readonly string[] = [
  "Chennai, Tamil Nadu", "Coimbatore, Tamil Nadu", "Madurai, Tamil Nadu", "Tiruchirappalli, Tamil Nadu", "Salem, Tamil Nadu",
  "Tirunelveli, Tamil Nadu", "Erode, Tamil Nadu", "Vellore, Tamil Nadu",
  "Bengaluru, Karnataka", "Mysuru, Karnataka", "Mangaluru, Karnataka", "Hubballi, Karnataka",
  "Hyderabad, Telangana", "Warangal, Telangana", "Visakhapatnam, Andhra Pradesh", "Vijayawada, Andhra Pradesh", "Tirupati, Andhra Pradesh",
  "Kochi, Kerala", "Thiruvananthapuram, Kerala", "Kozhikode, Kerala",
  "Mumbai, Maharashtra", "Pune, Maharashtra", "Nagpur, Maharashtra", "Nashik, Maharashtra",
  "Delhi", "New Delhi", "Gurugram, Haryana", "Noida, Uttar Pradesh", "Greater Noida, Uttar Pradesh", "Ghaziabad, Uttar Pradesh",
  "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Jaipur, Rajasthan", "Chandigarh", "Mohali, Punjab", "Indore, Madhya Pradesh", "Bhopal, Madhya Pradesh",
  "Ahmedabad, Gujarat", "Surat, Gujarat", "Vadodara, Gujarat", "Kolkata, West Bengal", "Bhubaneswar, Odisha", "Patna, Bihar",
  "Guwahati, Assam", "Goa", "Puducherry", "Remote", "Remote (India)", "Hybrid",
  "Singapore", "Dubai, UAE", "London, United Kingdom", "Berlin, Germany", "Toronto, Canada",
  "San Francisco, USA", "New York, USA", "Seattle, USA", "Austin, USA", "Sydney, Australia",
];

// Companies: the campus recruiters already offered in CompanyPicker, plus
// other common employers.
export const COMPANY_SUGGESTIONS: readonly string[] = Array.from(
  new Set([
    ...COMPANY_OPTIONS,
    "LTIMindtree", "Persistent Systems", "Mphasis", "Hexaware", "Zensar", "Birlasoft", "Cyient", "Sonata Software", "Coforge",
    "Amazon Web Services", "Meta", "Apple", "Netflix", "Uber", "Atlassian", "Salesforce", "Intel", "Nvidia", "Qualcomm", "Samsung",
    "Swiggy", "Razorpay", "PhonePe", "CRED", "Ola", "Myntra", "Meesho", "Nykaa", "BYJU'S", "Freshworks", "Zoho", "Chargebee", "Postman",
    "HDFC Bank", "ICICI Bank", "Axis Bank", "State Bank of India", "Kotak Mahindra Bank", "EY", "KPMG", "PwC", "Goldman Sachs", "JPMorgan Chase",
    "Reliance Jio", "Airtel", "L&T", "Bosch", "Siemens", "Tata Elxsi", "Ford", "Hyundai", "Renault Nissan",
  ])
);
