const socket = io();
const form = document.querySelector("#form");
const input = document.querySelector("input");
const sendBtn = document.querySelector("#sendBtn");
const sendLocation = document.querySelector("#send-location");
const messages = document.querySelector("#message");
const sidebar = document.querySelector("#sidebar");
//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const linkTemplate = document.querySelector("#link-template").innerHTML;
const sidebartemplate = document.querySelector("#sidebar-template").innerHTML;
//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  const newMessage = messages.lastElementChild;
  const newMessageStyle = getComputedStyle(newMessage);
  const Newmessagemargin = parseInt(newMessageStyle.marginBottom);
  const newMessagehieght = newMessage.offsetHeight + Newmessagemargin;
  const visibleHeight = messages.offsetHeight;
  const containerHeight = messages.scrollHeight;
  const scrollOfSet = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessagehieght <= scrollOfSet) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format("hh:mm A"),
    username: message.username,
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (message) => {
  const html = Mustache.render(linkTemplate, {
    url: message.url,
    createdAt: moment(message.createdAt).format("hh:mm A"),
    username: message.username,
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebartemplate, {
    room,
    users,
  });
  sidebar.innerHTML = html;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!input.value) return;

  sendBtn.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", input.value, (error) => {
    sendBtn.removeAttribute("disabled");
    input.value = "";
    input.focus();

    if (error) {
      return console.log(error);
    }
  });
});

sendLocation.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("ocation Is not supported By Your Browser");
  }

  sendLocation.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;

    socket.emit(
      "sendLocation",
      `https://google.com/maps?q=${latitude},${longitude}`,
      (message) => {
        sendLocation.removeAttribute("disabled");
        console.log(message);
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
