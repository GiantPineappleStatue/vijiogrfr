@echo off

REM Script to test the simple embedding script using API key from .env file

REM Check if .env file exists
if exist .env (
  echo Loading environment variables from .env file
  for /f "tokens=*" %%a in (.env) do (
    REM Skip comments and empty lines
    echo %%a | findstr /r "^#" > nul
    if errorlevel 1 (
      echo %%a | findstr /r "^$" > nul
      if errorlevel 1 (
        set %%a
      )
    )
  )
  echo Environment variables loaded from .env file
) else (
  echo Warning: .env file not found. Make sure OPENAI_API_KEY is set in your environment.
)

REM Create assets/embeddings directory if it doesn't exist
if not exist assets\embeddings mkdir assets\embeddings

REM Run the embedding script
echo Generating documentation embeddings using simplified script...
call npx ts-node scripts/simple-embed.ts --output=./assets/embeddings

REM Check if the script succeeded
if %errorlevel% equ 0 (
  echo Documentation embeddings generated successfully in ./assets/embeddings
) else (
  echo Error generating documentation embeddings. Check your API key and try again.
  exit /b 1
)
