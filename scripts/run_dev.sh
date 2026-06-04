#!/usr/bin/env bash

# Start Backend
echo "Starting Backend..."
cd backend
source venv/bin/activate
export PYTHONPATH=$PWD
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for Ctrl+C to stop both
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT
wait
