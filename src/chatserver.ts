import { Server, Socket } from "socket.io";

const io = new Server();
type name = string;
type socketId = string;
type roomName = string;
let guestNum = 1;
const nickNames: Record<socketId, name> = {};
const namesUsed: string[] = [];
const currentRoom: Record<socketId, roomName> = {};
// const rooms: string[] = ["CS50"];

io.on("connection", (socket) => {
  guestNum = assignGuestName(socket, guestNum);

  joinRoom(socket, "CS50");

  handleMessageBroadCasting(socket);

  handleRename(socket);

  handleRoomJoining(socket);

  socket.on("rooms", async () => {
    let rooms = JSON.parse(
      JSON.stringify(Array.from(io.of("/").adapter.rooms.keys()))
    );
    const socketIds = Object.keys(nickNames);
    for (const socketid of socketIds) {
      rooms = rooms.filter((n: string) => n !== socketid);
    }
    socket.emit("rooms", rooms);
  });

  handleClientDisconnection(socket);
});

// assign name to user Guest1 Guest2
const assignGuestName = (socket: Socket, guestNumber: number) => {
  const name = `Guest${guestNumber}`;
  nickNames[socket.id] = name;
  namesUsed.push(name);
  socket.emit("nameResult", {
    success: true,
    name,
  });

  return guestNumber + 1;
};

const joinRoom = async (socket: Socket, room: string) => {
  await socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit("joinResult", { room });
  socket.broadcast.to(room).emit("message", {
    text: `${nickNames[socket.id]} has joined ${room}.`,
  });
  const usersInRoom = io.of("/").adapter.rooms.get(room);
  if (usersInRoom && usersInRoom.size > 1) {
    let usersInRoomSummary = `Users currently in ${room}: `;
    for (const socketId of usersInRoom) {
      // except self
      if (socketId === socket.id) continue;
      usersInRoomSummary += `${nickNames[socketId]} `;
    }
    usersInRoomSummary += ".";
    socket.emit("message", { text: usersInRoomSummary });
  }
};

// 处理用户改名
const handleRename = (socket: Socket) => {
  socket.on("rename", (name) => {
    if (name.includes("Guest")) {
      socket.emit("nameResult", {
        success: false,
        message: 'Names cannot begin with "Guest"',
      });
    } else {
      if (namesUsed.includes(name)) {
        socket.emit("nameResult", {
          success: false,
          message: "That name is already in use.",
        });
      } else {
        const previousName = nickNames[socket.id];
        delete nickNames[socket.id];

        namesUsed.push(name);
        nickNames[socket.id] = name;

        socket.emit("nameResult", {
          success: true,
          name,
        });

        socket.broadcast.to(currentRoom[socket.id]).emit("message", {
          text: `${previousName} is now known as ${name}.`,
        });
      }
    }
  });
};

const handleMessageBroadCasting = (socket: Socket) => {
  socket.on("message", (message) => {
    socket.broadcast.to(message.room).emit("message", {
      text: `${nickNames[socket.id]} : ${message.text}`,
    });
  });
};

const handleRoomJoining = (socket: Socket) => {
  socket.on("join", async (room) => {
    await socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
};

const handleClientDisconnection = (socket: Socket) => {
  socket.on("disconnect", () => {
    const username: string = nickNames[socket.id];
    const room = currentRoom[socket.id];
    const nameIndex = namesUsed.findIndex((u) => u === username);

    delete namesUsed[nameIndex];
    delete nickNames[socket.id];

    socket.to(room).emit("message", {
      text: `user ${username} has left the room.`,
    });
  });
};

export default io;
