# 🎓 Digital Kafedra — Цифровий завкаф

> AI-powered web application for automating academic staff reporting 
> and accreditation monitoring at Ukrainian higher education institutions.

---

## 📌 About the Project

**Digital Kafedra** is a smart platform for department heads and academic staff 
of Ukrainian universities. It automates the collection, storage, and reporting 
of academic staff data in compliance with NAZYAVO licensing requirements.

### The Problem
Department heads spend dozens of hours annually collecting staff data manually, 
consolidating Excel tables, and preparing reports for accreditation commissions.

### The Solution
A unified digital platform where each staff member maintains their own cabinet, 
and the department head gets an AI-assisted admin panel with automated reporting.

---

## ✨ Key Features

### For Academic Staff
- 👤 Personal cabinet with profile data
- 📚 Publications, certificates, courses tracker
- 📊 Compliance progress bar (ліцензійні вимоги)
- 📄 Export reports in PDF and Excel
- 🌐 Public profile page (візитівка)
- 🤖 AI-generated posts about new publications

### For Department Head
- 🏛️ Admin panel with AI assistant
- 📈 Compliance progress bar for each staff member
- 📧 Automated notifications to staff
- 📋 Department-wide accreditation reports
- 👤 Individual staff reports for accreditation commission

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API |
| Auth | Supabase Auth |
| Export | PDF, Excel |
| Deployment | Vercel |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/onnozhovnik1970/digital-kafedra.git

# Install dependencies
cd digital-kafedra
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Authors

See [AUTHORS.md](AUTHORS.md) for details.

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 🏛️ Institution

State University of Trade and Economics (SUTE)  
Department of Modern European Languages  
Kyiv, Ukraine
