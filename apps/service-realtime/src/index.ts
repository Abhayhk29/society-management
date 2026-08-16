import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { startGrpcServer } from "./grpc/server";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT ?? 3003;
const GRPC_URL = process.env.GRPC_URL ?? "0.0.0.0:50052";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "service-realtime" });
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

startGrpcServer(GRPC_URL, "service-realtime");

httpServer.listen(PORT, () => {
  console.log(`service-realtime HTTP listening on port ${PORT}`);
});
