#!/bin/bash

echo "=== FAQ API Launcher ==="
echo ""

# First try to run with the full model
echo "Attempting to start the advanced model..."
python -c "import faiss" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "FAISS is installed. Starting the advanced model..."
    python faq_model.py
    exit 0
fi

# If FAISS isn't available, try the fallback model
echo "FAISS not found. Checking for fallback model..."
if [ -f "fallback_model.py" ]; then
    echo "Starting the fallback model..."
    python fallback_model.py
    exit 0
fi

# If all else fails, suggest installation
echo ""
echo "=========== ERROR ==========="
echo "Could not run either model."
echo ""
echo "Try running the install script:"
echo "python install_packages.py"
echo ""
echo "Or manually install minimal requirements:"
echo "pip install -r requirements_minimal.txt"
echo ""
echo "Then run the fallback model:"
echo "python fallback_model.py" 