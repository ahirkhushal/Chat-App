require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages.js");
const {
  adduser,
  removeUser,
  getUser,
  getuserInRoom,
} = require("./utils/users.js");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("new web socket connection");

  socket.on("join", (options, callback) => {
    const { error, user } = adduser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage("Welcome!", "Admin"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(`${user.username} has joined!`, "Admin")
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getuserInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("profenity is not allow");
    }

    io.to(user.room).emit("message", generateMessage(message, user.username));
    callback();
  });

  socket.on("sendLocation", (LocationUrl, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(LocationUrl, user.username)
    );
    callback("Location shared!");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          generateMessage(`${user.username} has left`, "Admin"),
          user.username
        );

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getuserInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
