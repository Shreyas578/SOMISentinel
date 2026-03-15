# SOMI Sentinel - Quick Start Guide

## 🚀 Deploy Contracts (When Mempool Clears)

### Windows:
```bash
deploy-when-ready.bat
```

### Manual:
```bash
cd contracts
npm run deploy
```

## 📝 After Deployment

### 1. Copy Contract Addresses
The deploy script will print addresses like:
```
MockToken:    0xABC...123
LendingPool:  0xDEF...456
Guardian:     0xGHI...789
```

### 2. Update Reactivity Service

Create/edit `reactivity-service/.env`:
```env
SOMNIA_WS_URL=wss://dream-rpc.somnia.network/ws
MOCK_TOKEN_ADDRESS=0xABC...123
LENDING_POOL_ADDRESS=0xDEF...456
GUARDIAN_ADDRESS=0xGHI...789
PORT=3001
```

### 3. Update Frontend

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_MOCK_TOKEN=0xABC...123
NEXT_PUBLIC_LENDING_POOL=0xDEF...456
NEXT_PUBLIC_GUARDIAN=0xGHI...789
NEXT_PUBLIC_REACTIVITY_WS=ws://localhost:3001
```

### 4. Start Services

**Terminal 1 - Reactivity Service:**
```bash
cd reactivity-service
npm run dev
```

Wait for: `✅ Connected to Somnia node via WebSocket`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Open App

Navigate to: **http://localhost:3000**

## 🎮 Demo Flow

1. **Connect Wallet**
   - Click "Connect MetaMask"
   - Approve Somnia Testnet addition
   - Confirm connection

2. **Get Test Tokens**
   - Click "Mint 5K STEST"
   - Wait for transaction
   - See balance update

3. **Deposit Collateral**
   - Click "Deposit Collateral"
   - Approve transaction
   - **Watch event appear instantly in log** ⚡

4. **Simulate Price Drop**
   - Click "Simulate Price Drop"
   - See risk meter turn red
   - See "LIQUIDATION RISK" alert
   - **Notice sub-second latency** ⚡

5. **Trigger Whale Alert**
   - Click "Trigger Whale Transfer"
   - See whale alert toast
   - See event in log

6. **Restore Position**
   - Click "Restore Position"
   - See risk meter return to green

## 🎥 Record Demo Video

Show these key points:

1. **Problem**: Traditional DeFi apps poll every 12 seconds
2. **Solution**: Somnia Reactivity pushes events instantly
3. **Demo**: Click button → event appears in <1 second
4. **Tech**: Show reactivity service terminal
5. **Benefits**: Zero polling, same-block delivery

## 🔍 Verify Everything Works

- [ ] Reactivity service shows: `✅ Connected to Somnia node`
- [ ] Frontend shows: `Somnia Reactivity LIVE`
- [ ] MetaMask connected to Somnia Testnet
- [ ] Events appear in log instantly after transactions
- [ ] Risk meter updates in real-time
- [ ] Whale alerts show as toasts

## 🐛 Troubleshooting

### Events not appearing?
- Check reactivity service is running
- Verify contract addresses in both .env files
- Check browser console for errors

### MetaMask not connecting?
- Manually add Somnia Testnet:
  - Network Name: Somnia Testnet
  - RPC URL: https://dream-rpc.somnia.network/
  - Chain ID: 50312
  - Currency: STT

### Transactions failing?
- Get testnet tokens: https://testnet.somnia.network/
- Check you're on Somnia Testnet in MetaMask

## 📚 Full Documentation

- **README.md** - Complete project overview
- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions
- **PROJECT_STATUS.md** - Full project status and checklist

## 🏆 Hackathon Submission

Include:
- ✅ GitHub repository link
- ✅ README.md (already complete)
- ✅ Demo video (2-5 minutes)
- ✅ Deployed contract addresses
- ✅ Explanation of Somnia Reactivity usage

## 🌐 Important Links

- **Somnia Testnet Faucet**: https://testnet.somnia.network/
- **Block Explorer**: https://shannon-explorer.somnia.network
- **RPC URL**: https://dream-rpc.somnia.network/
- **WebSocket**: wss://dream-rpc.somnia.network/ws
- **Chain ID**: 50312

---

**Need help?** Check DEPLOYMENT_GUIDE.md for detailed troubleshooting.

**Ready to deploy?** Run `deploy-when-ready.bat` or `cd contracts && npm run deploy`

Good luck! 🚀
