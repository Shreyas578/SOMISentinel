@echo off
echo ========================================
echo SOMI Sentinel - Smart Contract Deployment
echo ========================================
echo.
echo This script will deploy contracts to Somnia Testnet
echo Make sure you have STT tokens in your wallet!
echo.
echo Faucet: https://testnet.somnia.network/
echo.
pause

cd contracts
echo.
echo Starting deployment...
echo.
call npm run deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ DEPLOYMENT SUCCESSFUL!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Copy the contract addresses from above
    echo 2. Update reactivity-service/.env
    echo 3. Update frontend/.env.local
    echo 4. Run: cd reactivity-service ^&^& npm run dev
    echo 5. Run: cd frontend ^&^& npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ DEPLOYMENT FAILED
    echo ========================================
    echo.
    echo Common issues:
    echo - Mempool full: Wait 10-30 minutes and try again
    echo - Insufficient funds: Get STT from faucet
    echo - Network error: Check internet connection
    echo.
    echo See DEPLOYMENT_GUIDE.md for alternative methods
    echo.
)

pause
