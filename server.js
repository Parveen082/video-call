import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("offer", (data) => {
    socket.to(data.to).emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.to(data.to).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.to).emit("ice-candidate", data);
  });
});

httpServer.listen(5000, () => {
  console.log("Socket server running on 5000");
});