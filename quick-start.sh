#!/bin/bash

echo "🚀 LegalCollab Platform - Quick Start Setup"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB with Docker..."
    docker run -d -p 27017:27017 --name mongodb mongo:latest
    sleep 5
fi

echo "📦 Installing Backend Dependencies..."
cd legal-collab-platform-backend
npm install

echo "📦 Installing Frontend Dependencies..."
cd ../legal-collab-platform
npm install

echo "🔧 Setting up Environment Variables..."

# Create backend .env file
cat > ../legal-collab-platform-backend/.env << EOL
# Database
MONGODB_URI=mongodb://localhost:27017/legalcollab

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# OpenAI (Add your API key here)
OPENAI_API_KEY=your-openai-api-key-here

# Email (Configure your email settings)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Server
PORT=5000
NODE_ENV=development
EOL

# Create frontend .env.local file
cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOL

echo "✅ Environment files created!"
echo ""
echo "⚠️  IMPORTANT: Please update the following in legal-collab-platform-backend/.env:"
echo "   - OPENAI_API_KEY: Add your OpenAI API key"
echo "   - EMAIL_USER: Add your email address"
echo "   - EMAIL_PASS: Add your email app password"
echo ""
echo "🚀 Starting servers..."

# Start backend in background
cd ../legal-collab-platform-backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
cd ../legal-collab-platform
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Servers are starting!"
echo "   Backend: http://localhost:5000"
echo "   Frontend: http://localhost:3001"
echo ""
echo "📋 Next Steps:"
echo "   1. Open http://localhost:3001 in your browser"
echo "   2. Create an admin account at /admin/login"
echo "   3. Add some templates and clauses"
echo "   4. Create a user account and test the flow"
echo ""
echo "🛑 To stop servers: Press Ctrl+C"

# Wait for user to stop
wait
