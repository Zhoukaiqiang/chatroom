const { Server } = require("socket.io");

let io;
let guestNum = 1;
const nickNames = {};
const namesUsed = [];
const currentRoom = {};

exports.listen = function (server) {
  io = new Server(server);

  io.set("log level", 1);

  io.on("connection", (socket) => {
    guestNum = assignGuestName(socket, guestNum, nickNames, namesUsed);

    joinRoom(socket, "CS50");
    handleMessageBroadCasting(socket, nickNames);

    handleNameChangeAttempts(socket, nickNames, namesUsed);

    handleRoomJoining(socket);

    socket.on("rooms", () => {
      socket.emit("rooms", io.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};

// 给用户分配名字 Guest1 Guest2
const assignGuestName = (socket, guestNum, nickNames, namesUsed) => {
  const name = "Guest" + guestNum;
  nickNames[socket.id] = name;
  socket.emit("nameResult", {
    success: true,
    name,
  });
  namesUsed.push(name);
  return guestNum + 1;
};

const joinRoom = (socket, room) => {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit("joinResult", { room });
  socket.broadcast.to(room).emit("message", {
    text: `${nickNames[socket.id]} has joined ${room}.`,
  });
  const usersInRoom = io.clients(room);
  if (usersInRoom.length > 1) {
    let usersInRoomSummary = `Users currently in ${room} :`;

    for (const index in usersInRoom) {
      const userSocketId = usersInRoom[index].id;
      if (userSocketId !== socket.id) {
        if (index > 0) {
          usersInRoomSummary += ", ";
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += ".";
    socket.emit("message", { text: usersInRoomSummary });
  }
};

/**
 * 处理用户改名
 */
const handleNameChangeAttempts = (socket, nickNames, namesUsed) => {
  socket.on("nameAttempt", (name) => {
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
        const previousNameIndex = nickNames.findIndex((n) => socket.id === n);
        const previousName = nickNames[previousNameIndex];
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];

        socket.emit("nameResult", {
          success: true,
          message: "Success",
          name,
        });

        socket.broadcast.to(currentRoom[socket.id]).emit("message", {
          text: `${previousName} is now known as ${name}.`,
        });
      }
    }
  });
};

const handleMessageBroadCasting = (socket, nickNames) => {
  socket.on("message", (message) => {
    socket.broadcast.to(message.room).emit("message", {
      text: `${nickNames[socket.id]} : ${message.text}`,
    });
  });
};

const handleRoomJoining = (socket) => {
  socket.on("join", (room) => {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
};

const handleClientDisconnection = (socket) => {
  socket.on("disconnect", () => {
    const nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
};
