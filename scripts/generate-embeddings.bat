@echo off
REM Script to generate embeddings using API key from .env file

REM Load environment variables from .env file if it exists
if exist .env (
  for /F "tokens=*" %%i in (.env) do set %%i
)

REM Check if OPENAI_API_KEY is set
if "%OPENAI_API_KEY%"=="" (
  echo Error: OPENAI_API_KEY is not set. Please set it in your .env file or environment.
  exit /b 1
)

REM Define paths
set ASSETS_DIR=.\assets\embeddings
set USER_DATA_DIR=%USERPROFILE%\.blenderae-assistant
set EMBEDDINGS_FILE=docs.json
set ASSETS_EMBEDDINGS_PATH=%ASSETS_DIR%\%EMBEDDINGS_FILE%
set USER_DATA_EMBEDDINGS_PATH=%USER_DATA_DIR%\%EMBEDDINGS_FILE%

REM Create directories if they don't exist
if not exist "%ASSETS_DIR%" mkdir "%ASSETS_DIR%"
if not exist "%USER_DATA_DIR%" mkdir "%USER_DATA_DIR%"

REM Check if embeddings already exist in either location
if exist "%ASSETS_EMBEDDINGS_PATH%" (
  echo Embeddings already exist. Skipping embedding generation.

  REM If embeddings exist in assets but not in user data, copy them
  if not exist "%USER_DATA_EMBEDDINGS_PATH%" (
    echo Copying embeddings from assets to user data directory...
    copy "%ASSETS_EMBEDDINGS_PATH%" "%USER_DATA_EMBEDDINGS_PATH%"
  )

  exit /b 0
)

if exist "%USER_DATA_EMBEDDINGS_PATH%" (
  echo Embeddings already exist in user data directory. Skipping embedding generation.
  exit /b 0
)

echo Generating documentation embeddings...

REM Run the embedding script
npx ts-node scripts\embed-documentation.ts --api-key "%OPENAI_API_KEY%" --output "%ASSETS_EMBEDDINGS_PATH%"

REM Check if embedding was successful
if %ERRORLEVEL% equ 0 if exist "%ASSETS_EMBEDDINGS_PATH%" (
  echo Embeddings generated successfully at %ASSETS_EMBEDDINGS_PATH%

  REM Copy to user data directory
  echo Copying embeddings to user data directory...
  copy "%ASSETS_EMBEDDINGS_PATH%" "%USER_DATA_EMBEDDINGS_PATH%"

  echo Embedding process completed.
) else (
  echo Error: Failed to generate embeddings.
  exit /b 1
)
