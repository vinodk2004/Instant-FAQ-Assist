@echo off
echo === FAQ API Launcher ===
echo.

REM First try to run with the full model
echo Attempting to start the advanced model...
python -c "import faiss" 2>NUL
if %ERRORLEVEL% EQU 0 (
    echo FAISS is installed. Starting the advanced model...
    python faq_model.py
    goto :end
)

REM If FAISS isn't available, try the fallback model
echo FAISS not found. Checking for fallback model...
if exist fallback_model.py (
    echo Starting the fallback model...
    python fallback_model.py
    goto :end
)

REM If all else fails, suggest installation
echo.
echo =========== ERROR ===========
echo Could not run either model.
echo.
echo Try running the install script:
echo python install_packages.py
echo.
echo Or manually install minimal requirements:
echo pip install -r requirements_minimal.txt
echo.
echo Then run the fallback model:
echo python fallback_model.py

:end 