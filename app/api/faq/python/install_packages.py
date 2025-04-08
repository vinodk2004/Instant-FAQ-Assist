#!/usr/bin/env python
"""
Helper script to install required packages for the FAQ API.
"""
import sys
import subprocess
import platform

def run_command(command):
    """Run a command and return True if it succeeded."""
    print(f"Running: {' '.join(command)}")
    try:
        subprocess.check_call(command)
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    """Install packages in the recommended order."""
    print("Starting installation of required packages...")
    
    # Step 1: Install basic packages first
    print("\n== Step 1: Installing basic packages ==")
    basic_install = run_command([
        sys.executable, "-m", "pip", "install", "-r", "requirements_minimal.txt"
    ])
    
    if not basic_install:
        print("❌ Failed to install basic packages. Please check your Python environment.")
        return

    # Step 2: Install sentence-transformers
    print("\n== Step 2: Installing sentence-transformers ==")
    st_install = run_command([
        sys.executable, "-m", "pip", "install", "sentence-transformers==2.2.2"
    ])
    
    if not st_install:
        print("❌ Failed to install sentence-transformers.")
        return

    # Step 3: Install scikit-learn
    print("\n== Step 3: Installing scikit-learn ==")
    sklearn_install = run_command([
        sys.executable, "-m", "pip", "install", "scikit-learn==1.0.2"
    ])
    
    if not sklearn_install:
        print("❌ Failed to install scikit-learn.")
        print("Try installing Visual C++ Build Tools for Windows or build essentials for Linux.")
        return

    # Step 4: Install FAISS
    print("\n== Step 4: Installing FAISS ==")
    
    # Try different FAISS versions based on platform
    system = platform.system()
    if system == "Windows":
        faiss_options = [
            ["faiss-cpu==1.7.3"],
            ["faiss-cpu==1.7.2"],
            ["faiss-cpu==1.7.0"],
        ]
    else:
        faiss_options = [
            ["faiss-cpu"],
            ["faiss-cpu==1.7.3"],
        ]
    
    faiss_installed = False
    for faiss_version in faiss_options:
        print(f"Trying to install {faiss_version[0]}...")
        if run_command([sys.executable, "-m", "pip", "install"] + faiss_version):
            faiss_installed = True
            break
    
    if not faiss_installed:
        print("❌ Failed to install FAISS.")
        print("Consider using Conda instead:")
        print("  conda install -c conda-forge faiss-cpu")
        return

    # Step 5: Download NLTK data
    print("\n== Step 5: Downloading NLTK data ==")
    nltk_install = run_command([
        sys.executable, "-c", "import nltk; nltk.download('wordnet')"
    ])
    
    if not nltk_install:
        print("❌ Failed to download NLTK data.")
        return

    print("\n✅ All packages installed successfully!")
    print("You can now run the API with: python faq_model.py")

if __name__ == "__main__":
    main() 