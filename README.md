# CV Evaluator – Full Stack Application

This project is a full-stack CV evaluation tool that matches CVs against job descriptions and returns a compatibility score with detailed section analysis. It includes both frontend and backend components built with modern web technologies.

## 🌐 Technologies Used

### Frontend:
- **React** (with Vite)
- **Tailwind CSS**
- **Lucide Icons**
- **Axios**

### Backend:
- **Node.js**
- **Express**
- **OpenAI API**
- **dotenv**
- **cors**
- **multer** (for file uploads)

## 📦 Getting Started

Follow the steps below to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/turalhsnl/cv-evaluator-full.git
cd cv-evaluator-full
```

### 2. Install Dependencies

Install the required `node_modules` for both frontend and backend:

```bash
npm install
```

### 3. Set Up Environment Variables

Navigate to the `backend` directory and create a `.env` file with the required API keys and configurations.

Example `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

> 🔐 Make sure not to commit your `.env` file to the repository.

### 4. Run the Application

Start both the backend and frontend concurrently:

```bash
npm run dev
```

This will launch the development servers for both parts of the application.

## 📁 Project Structure

```
cv-evaluator-full/
├── backend/
│   ├── index.js
│   └── ...
├── frontend/
│   ├── src/
│   └── ...
├── .gitignore
├── README.md
└── package.json
```


