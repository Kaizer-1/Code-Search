#!/usr/bin/env bash
set -e

echo "Setting up CodeSearch..."

# 1. Setup Backend
echo "Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 2. Setup Frontend
echo "Setting up Frontend..."
cd frontend
npm install
cd ..

# 3. Download Data and Build Indexes
echo "Downloading Data and Building Indexes..."
cd backend
source venv/bin/activate
export PYTHONPATH=$PWD
python app/indexing/download_data.py
python app/indexing/build_index.py
python app/clustering/kmeans_cluster.py
cd ..

echo "Setup complete! Run 'bash scripts/run_dev.sh' to start."
