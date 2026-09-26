cd c:\projects\practice\society-management-workspace

npm run dev:core        # NestJS core (DB + JWT auth + gRPC :50051)
npm run dev:gateway     # NestJS BFF :3001
npm run dev:frontend    # Nivas UI :3000

npm run dev:realtime    # Express + WebSockets + gRPC :50052
npm run dev:analytics   # FastAPI + gRPC :50053

See README.md for full docs (auth APIs, RBAC, env vars, roadmap).
