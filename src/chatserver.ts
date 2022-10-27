import { Server, Socket } from "socket.io";

const io = new Server();
type name = string;
type socketId = string;
type roomName = string;
let guestNum = 1;
const nickNames: Record<socketId, name> = {};
const namesUsed: string[] = [];
const currentRoom: Record<socketId, roomName> = {};
const rooms: string[] = ["CS50"];

io.on("connection", (socket) => {
  guestNum = assignGuestName(socket, guestNum);

  joinRoom(socket, rooms[0]);
  handleMessageBroadCasting(socket);

  handleRename(socket);

  handleRoomJoining(socket);

  socket.on("rooms", async () => {
    const roomss = io.of('/').adapter.rooms
    console.log(roomss);
    socket.emit("rooms", rooms);
  });

  handleClientDisconnection(socket);
});

const getRooms = (socket: Socket) => {
  const rooms = new Set(socket.rooms);
  for (const room in currentRoom) {
    rooms.delete(room);
  }
  return Array.from(rooms);
};
// 给用户分配名字 Guest1 Guest2
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

const joinRoom = (socket: Socket, room: any) => {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit("joinResult", { room });
  socket.broadcast.to(room).emit("message", {
    text: `${nickNames[socket.id]} has joined ${room}.`,
  });
  // const usersInRoom = io.clients(room);
  const usersInRoom: any[] = [];
  if (usersInRoom.length > 1) {
    let usersInRoomSummary = `Users currently in ${room} :`;
    console.log(socket.rooms);
    for (const index in usersInRoom) {
      const userSocketId = usersInRoom[index].id;
      if (userSocketId !== socket.id) {
        // if (index > 0) {
        //   usersInRoomSummary += ", ";
        // }
        usersInRoomSummary += nickNames[userSocketId];
      }
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
  socket.on("join", (room) => {
    socket.leave(currentRoom[socket.id]);
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
