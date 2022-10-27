class Chat {
  constructor(socket) {
    if (!socket) {
      return new Error("The Chat class need socket as parameter");
    }
    this.socket = socket;
  }

  sendMessage(room, text) {
    const message = {
      room,
      text,
    };
    this.socket.emit("message", message);
  }
  changeRoom(room) {
    this.socket.emit("join", {
      newRoom: room,
    });
  }

  processCommand(command) {
    const words = command.split(" ");
    const cmd = words[0].substring(1, words[0].length).toLowerCase();
    let message;

    switch (cmd) {
      case "join":
        words.shift();
        const room = words.join(" ");
        this.changeRoom(room);
        break;
      case "rename":
        words.shift();
        const name = words.join(" ");
        this.socket.emit("rename", name);
        break;
      default:
        message = "Unrecognize command.";
        break;
    }

    return message;
  }
}
