#!/bin/bash

# COSOS Setup Script
# This script will guide you through setting up COSOS

set -e

echo "=========================================="
echo "COSOS Setup Wizard"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Python version
echo "Step 1: Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Found Python $PYTHON_VERSION"

if [[ "$PYTHON_VERSION" < "3.11" ]]; then
    echo -e "${YELLOW}Warning: Python 3.11+ is recommended. You have $PYTHON_VERSION${NC}"
    echo "You can continue, but some features may not work."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Create virtual environment
echo ""
echo "Step 2: Creating virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}Virtual environment already exists${NC}"
fi

# Step 3: Activate and install dependencies
echo ""
echo "Step 3: Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Step 4: Check .env file
echo ""
echo "Step 4: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}.env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: You need to configure your .env file with:${NC}"
    echo "  1. Supabase credentials"
    echo "  2. Google OAuth credentials"
    echo "  3. OpenAI API key"
    echo ""
    echo "See docs/SETUP_GUIDE.md for detailed instructions."
    echo ""
    read -p "Press Enter when you've configured .env..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Step 5: Run setup test
echo ""
echo "Step 5: Testing configuration..."
python test_setup.py

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✓ Setup Complete!"
    echo "==========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start the backend:"
    echo "   cd backend"
    echo "   source venv/bin/activate"
    echo "   uvicorn main:app --reload"
    echo ""
    echo "2. Open http://localhost:8000/docs"
    echo "3. Test the OAuth flow"
    echo ""
else
    echo ""
    echo -e "${RED}=========================================="
    echo "✗ Setup Failed"
    echo "==========================================${NC}"
    echo ""
    echo "Please fix the errors above and run this script again."
    echo "See docs/SETUP_GUIDE.md for help."
    echo ""
fi

