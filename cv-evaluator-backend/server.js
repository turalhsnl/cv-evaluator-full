// server.js
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

dotenv.config();
console.log('Environment Check:');
console.log('- OpenAI API Key length:', process.env.OPENAI_API_KEY?.length);
console.log('- Storage Path:', process.env.PDF_STORAGE_PATH);
console.log('- Max File Size:', process.env.MAX_FILE_SIZE);
console.log('- Allowed Origins:', process.env.ALLOWED_ORIGINS);
const app = express();
const port = process.env.PORT || 3001;

const DATABASE = {
  users: [],
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Normalize upload directory path
const uploadDir = process.env.PDF_STORAGE_PATH 
  ? path.normalize(process.env.PDF_STORAGE_PATH)
  : path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
  }
} catch (error) {
  console.error(`Error creating upload directory: ${error.message}`);
  process.exit(1);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedFilename}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Add response tracking middleware
app.use((req, res, next) => {
  const oldJson = res.json;
  res.json = function(data) {
    console.log('Response data:', JSON.stringify(data, null, 2));
    return oldJson.apply(res, arguments);
  };
  next();
});

// Helper function to extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    if (!dataBuffer || dataBuffer.length === 0) {
      throw new Error('Empty PDF file');
    }

    const data = await pdf(dataBuffer);
    if (!data || !data.text) {
      throw new Error('Failed to extract text from PDF');
    }

    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Helper function to analyze CV using OpenAI
async function analyzeCV(cvText, jobText) {
  try {
    const prompt = `
      Analyze the following CV against the job description and return the analysis in JSON format:
      CV: ${cvText}
      Job Description: ${jobText}
      
      Return the response in this exact JSON structure:
      {
        "matchScore": number between 0-100,
        "sections": [
          {
            "title": "Skills Analysis",
            "description": "detailed analysis of skills match"
          },
          {
            "title": "Experience Match",
            "description": "detailed analysis of experience relevance"
          },
          {
            "title": "Education Relevance",
            "description": "detailed analysis of education fit"
          },
          {
            "title": "Missing Keywords",
            "description": ["keyword1", "keyword2", "keyword3"]
          },
          {
            "title": "Recommendations",
            "description": "detailed improvement suggestions"
          }
        ]
      }
      
      Important: For Missing Keywords section, ensure each keyword is a separate string in the array.
      Example: ["Java", "microservices", "API", "agile"] instead of a single concatenated string.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert CV analyzer. Always return Missing Keywords as an array of distinct strings, with each keyword properly separated." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    
    // Ensure Missing Keywords are properly formatted
    const formattedAnalysis = {
      matchScore: analysis.matchScore,
      sections: analysis.sections.map(section => {
        if (section.title === "Missing Keywords" && !Array.isArray(section.description)) {
          // Convert string to array if needed and clean up
          section.description = section.description
            .split(/[,\s]+/)
            .filter(keyword => keyword.length > 0)
            .map(keyword => keyword.trim());
        }
        return {
          ...section,
          status: determineStatus(section.title, section.description, analysis.matchScore)
        };
      })
    };

    console.log('Formatted Analysis:', JSON.stringify(formattedAnalysis, null, 2));
    return formattedAnalysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

// Helper function to determine section status
function determineStatus(title, content, matchScore) {
  if (!content) return 'error';
  
  const contentLower = String(content).toLowerCase();
  
  switch (title) {
    case 'Skills Analysis':
      return matchScore >= 80 ? 'success' : matchScore >= 60 ? 'warning' : 'error';
    case 'Missing Keywords':
      return contentLower.includes('no missing') || contentLower.includes('none') ? 'success' : 'warning';
    case 'Recommendations':
      return 'warning';
    default:
      if (contentLower.includes('strong') || 
          contentLower.includes('excellent') || 
          contentLower.includes('perfect') || 
          contentLower.includes('great')) {
        return 'success';
      }
      if (contentLower.includes('lacking') || 
          contentLower.includes('missing') || 
          contentLower.includes('weak') || 
          contentLower.includes('poor')) {
        return 'error';
      }
      return 'warning';
  }
}

async function generatePDFReport(reportData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Add content to PDF
    doc.fontSize(20).text('CV Evaluation Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Match Score: ${reportData.matchScore}%`);
    doc.moveDown();

    reportData.sections.forEach(section => {
      doc.fontSize(14).text(section.title);
      if (Array.isArray(section.description)) {
        section.description.forEach(item => {
          doc.fontSize(12).text(`• ${item}`);
        });
      } else {
        doc.fontSize(12).text(section.description);
      }
      doc.moveDown();
    });

    doc.end();
  });
}

// API Endpoints
app.post('/api/evaluate', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'jobDescription', maxCount: 1 }
]), async (req, res) => {
  let uploadedFiles = [];
  try {
    if (!req.files?.cv?.[0] || !req.files?.jobDescription?.[0]) {
      return res.status(400).json({ error: 'Both CV and job description are required' });
    }

    const cvPath = req.files.cv[0].path;
    const jobPath = req.files.jobDescription[0].path;
    uploadedFiles = [cvPath, jobPath];

    const cvText = await extractTextFromPDF(cvPath);
    const jobText = await extractTextFromPDF(jobPath);
    const analysis = await analyzeCV(cvText, jobText);    

    // Clean up files
    uploadedFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Format response data
    const responseData = {
      success: true,
      matchScore: analysis.matchScore,
      sections: analysis.sections.map(section => ({
        title: section.title,
        description: section.description,
        status: section.status
      }))
    };

    console.log('Sending final response:', JSON.stringify(responseData, null, 2));
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Evaluation error details:', error);
    uploadedFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to evaluate CV',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add this endpoint after your existing /api/evaluate endpoint
app.post('/api/generate-report', async (req, res) => {
  try {
    const reportData = req.body;
    const pdfBuffer = await generatePDFReport(reportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cv-evaluation-report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

app.post('/api/signup', async (req, res) => {
  const signupData = req.body;
  if (!signupData) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const {username, password, confirmPassword} = signupData;
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Missing username, password, or confirm password' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const existingUser = DATABASE.users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  DATABASE.users.push({
    username,
    password: await hashPassword(password),
  });

  const token = jwt.sign({ username }, process.env.JWT_SECRET);


  res.cookie('session', token, {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.status(200).json({ message: 'User created successfully' });
});

app.post('/api/login', async (req, res) => {
  const loginData = req.body;
  if (!loginData) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const {username, password } = loginData;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  const existingUser = DATABASE.users.find(user => user.username === username);
  if (!existingUser) {
    return res.status(400).json({ error: 'User not found' });
  }

  if (!await comparePasswords(existingUser.password, password)) {
    return res.status(400).json({ error: 'Incorrect password' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET);


  res.cookie('session', token, {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.status(200).json({ message: 'User logged in successfully' });
});

app.get('/api/session', async (req, res) => {
  const token = req.cookies?.session;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { username } = jwt.verify(token, process.env.JWT_SECRET);
    const user = DATABASE.users.find(user => user.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      user: {
        username,
      },
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post('/api/logout', async (req, res) => {
  res.clearCookie('session');
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Generic error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred' 
  });
});

// Start server
app.listen(port, () => {
  console.log('\n=== CV Evaluator Server ===');
  console.log(`Server running on port ${port}`);
  console.log(`Upload directory: ${uploadDir}`);
  console.log(`CORS origin: ${process.env.ALLOWED_ORIGINS}`);
  console.log(`Max file size: ${process.env.MAX_FILE_SIZE / 1024 / 1024}MB`);
  console.log('==========================\n');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(
  storedPassword,
  suppliedPassword
) {
  // split() returns array
  const [hashedPassword, salt] = storedPassword.split(".");
  // we need to pass buffer values to timingSafeEqual
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  // we hash the new sign-in password
  const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64));
  // compare the new supplied password with the stored hashed password
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}
