# ResumeIQ AI

An AI-powered Resume Analyzer with ATS scoring, skill detection, and job matching capabilities. Get instant feedback on your resume with advanced AI analysis and actionable recommendations.

![ResumeIQ AI](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

## 🚀 Features

- **AI-Powered Analysis**: Advanced AI analysis using Google Gemini API with OpenRouter fallback
- **ATS Scoring Engine**: Custom ATS engine that evaluates resumes against industry standards
- **Skill Detection**: Automatic detection and categorization of technical skills
- **Job Matching**: Compare your resume against job descriptions for match analysis
- **Smart Rewrite**: AI-powered suggestions to improve resume sections
- **Detailed Reports**: Beautiful, comprehensive reports with charts and insights
- **Recruiter Insights**: AI-generated guidance on likely recruiter impressions
- **Multiple Format Support**: Upload PDF and DOCX files
- **Drag & Drop Interface**: Modern, intuitive upload experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Automatic dark mode based on system preferences

## 📸 Screenshots

### Landing Page
![Landing Page](screenshots/landing.png)

### Upload Interface
![Upload Interface](screenshots/upload.png)

### Analysis Report
![Analysis Report](screenshots/report.png)

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3 (with custom properties and glassmorphism)
- Vanilla JavaScript (ES6+)
- Chart.js (for data visualization)
- Font Awesome (for icons)

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose ODM

### AI Services
- Google Gemini API (Primary)
- OpenRouter API (Fallback)

### File Processing
- pdf-parse (PDF extraction)
- mammoth (DOCX extraction)

### Security & Performance
- Helmet (Security headers)
- CORS (Cross-origin resource sharing)
- express-rate-limit (Rate limiting)
- compression (Response compression)

## 📁 Project Structure

```
ResumeIQ-AI/
├── client/
│   ├── css/
│   │   ├── style.css
│   │   └── report.css
│   ├── js/
│   │   ├── main.js
│   │   └── report.js
│   ├── images/
│   ├── pages/
│   ├── components/
│   ├── assets/
│   ├── index.html
│   └── report.html
├── server/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── resumeController.js
│   ├── middleware/
│   │   └── upload.js
│   ├── models/
│   │   └── Resume.js
│   ├── routes/
│   │   └── index.js
│   ├── services/
│   │   ├── aiRouter.js
│   │   ├── atsEngine.js
│   │   ├── fileParser.js
│   │   └── skillDetector.js
│   ├── utils/
│   ├── uploads/
│   ├── temp/
│   ├── app.js
│   └── server.js
├── .env
├── .env.example
├── package.json
└── README.md
```

## 🔧 Installation

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account
- Google Gemini API key
- OpenRouter API key (optional, for fallback)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd resumeIQ
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://your-connection-string
   GEMINI_API_KEY=your_gemini_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_MODEL=anthropic/claude-3-haiku
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

5. **Access the application**
   
   Open your browser and navigate to `http://localhost:5000`

## 🌐 Deployment

### Backend Deployment (Render)

1. Create a new account on [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set the following environment variables in Render:
   - `PORT`
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `FRONTEND_URL` (your Vercel URL)
   - `NODE_ENV=production`
5. Deploy!

### Frontend Deployment (Vercel)

1. Create a new account on [Vercel](https://vercel.com)
2. Create a new project
3. Import your GitHub repository
4. Configure the project:
   - Root directory: `client`
   - Build command: (none needed for static site)
   - Output directory: `(empty)`
5. Add environment variables if needed
6. Deploy!

## 📡 API Endpoints

### Upload Resume
```http
POST /api/upload
Content-Type: multipart/form-data
```

**Body**: `resume` (file)

**Response**:
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": { ... },
  "resumeId": "string"
}
```

### Analyze Resume
```http
POST /api/analyze
Content-Type: application/json
```

**Body**:
```json
{
  "resumeId": "string",
  "jobDescription": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Resume analyzed successfully",
  "data": { ... }
}
```

### Job Match
```http
POST /api/job-match
Content-Type: application/json
```

**Body**:
```json
{
  "resumeId": "string",
  "jobDescription": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Job match analysis completed",
  "data": { ... }
}
```

### Rewrite Section
```http
POST /api/rewrite
Content-Type: application/json
```

**Body**:
```json
{
  "section": "string",
  "originalText": "string",
  "context": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Section rewritten successfully",
  "data": { ... }
}
```

### Get Report
```http
GET /api/report/:id
```

**Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

## 🔒 Security Features

- **Helmet**: Security headers for Express.js
- **CORS**: Configured for allowed origins only
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: File type and size validation
- **File Cleanup**: Automatic deletion of uploaded files
- **Environment Variables**: All secrets stored in .env
- **No API Key Exposure**: API keys never sent to frontend

## 🎨 UI Features

- **Modern Design**: Clean, professional interface
- **Glassmorphism**: Modern glass-like card effects
- **Gradient Themes**: Beautiful blue gradient color scheme
- **Smooth Animations**: CSS transitions and keyframe animations
- **Responsive Layout**: Mobile-first responsive design
- **Dark Mode**: Automatic dark mode support
- **Interactive Charts**: Dynamic Chart.js visualizations
- **Progress Indicators**: Visual feedback during uploads
- **Drag & Drop**: Intuitive file upload experience

## 📊 Score Categories

The application evaluates resumes across multiple dimensions:

- **Resume Score**: Overall resume quality (0-100)
- **ATS Score**: ATS system compatibility (0-100)
- **Formatting Score**: Visual formatting quality (0-100)
- **Grammar Score**: Language and grammar quality (0-100)
- **Project Score**: Project section quality (0-100)
- **Experience Score**: Work experience quality (0-100)
- **Education Score**: Education section quality (0-100)
- **Skill Score**: Skills section quality (0-100)
- **Keyword Score**: Keyword relevance (0-100)

## 🔮 Future Improvements

- [ ] User authentication and account system
- [ ] Resume history and comparison
- [ ] Multiple resume templates
- [ ] Export to different formats
- [ ] Real-time collaboration
- [ ] Integration with LinkedIn
- [ ] Advanced grammar checking
- [ ] Video resume support
- [ ] Mobile app (React Native)
- [ ] Browser extension

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@resumeiq.ai or open an issue on GitHub.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- OpenRouter for AI fallback services
- Chart.js for data visualization
- Font Awesome for icons
- MongoDB Atlas for database hosting

---

Built with ❤️ by ResumeIQ AI Team
