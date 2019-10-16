let notifier = new Notifier();
let client = {
  "layers": {},
  "canvas": document.getElementById("display"),
  "ctx": document.getElementById("display").getContext("2d"),
  "users": {},
  "name": "",
  "id": "",
  "queued": 0,
  "timers": {
    "vote": {
      "start": 0,
      "timeleft": 0
    },
    "turn": {
      "start": 0,
      "timeleft": 0
    }
  },
  "reset": {
    "ongoing": 2,
    "y": 0,
    "n": 0
  },
  "mouse": 0,
  "focused": false
};
function generateId() {
  let idCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_=+";
  let id = "";
  let ids = Object.keys(client.users);
  while (id.length == 0 || ids.indexOf(ids) > -1) {
    id = "";
    for (var i = 0; i < 32; i++) {
      id += idCharacters.charAt(Math.floor(Math.random() * idCharacters.length));
    }
  }
  return id;
}
function newLayer() {
  let canvas = document.createElement('canvas');
  let layer = {
    "canvas": canvas,
    "ctx": canvas.getContext("2d"),
    "x": 0,
    "y": 0
  };
  return layer;
}
function getUserById(id) {
  return client.users[id];
}
function getUserByName(name) {
  for (var id in client.users) {
    if (client.users[id].name == name) return client.users[id];
  }
  return;
}
function createUserElement(name, id) {
  let container = document.createElement("div");
  container.classList.add("user");
  container.id = id;
  let nameElement = document.createElement("span");
  nameElement.classList.add("name");
  nameElement.innerText = name;
  container.appendChild(nameElement);
  let options = document.createElement("div");
  options.classList.add("options");
  container.appendChild(options);
  let muteBtn = document.createElement("span");
  muteBtn.innerText = "Mute";
  options.appendChild(muteBtn);
  muteBtn.onclick = function() {
    let user = getUserById(container.id);
    user.mute = !user.mute;
    if (user.mute) {
      muteBtn.innerText = "Unmute";
    } else {
      muteBtn.innerText = "Mute";
    }
  };
  nameElement.onclick = function() {
    if (options.classList.contains("open")) {
      options.classList.remove("open");
    } else {
      options.classList.add("open");
    }
  };
  document.getElementById("userlist").appendChild(container);
  return container;
}
function createChatElement(name, time, message) {
  let container = document.createElement("div");
  container.classList.add("message");
  let timeElement = document.createElement("span");
  timeElement.classList.add("time");
  if (typeof time == "undefined") {
    let date = new Date();
    let h = (date.getHours() % 12 == 0 ? 12 : date.getHours() % 12);
    let m = ("00" + date.getMinutes()).substr(-2);
    let a = (date.getHours() > 11 ? "PM" : "AM");
    timeElement.innerText = h + ":" + m + " " + a;
  } else {
    timeElement.innerText = time;
  }
  container.appendChild(timeElement);
  if (typeof name == "string") {
    let nameElement = document.createElement("span");
    nameElement.classList.add("name");
    nameElement.innerText = name;
    container.appendChild(nameElement);
  }
  if (typeof message == "string") {
    let msgElement = document.createElement("p");
    msgElement.classList.add("content");
    msgElement.innerHTML = message;
    container.appendChild(msgElement);
  }
  return container;
}
function addChat(mute, name, message, time) {
  let messages = document.getElementById("messages");
  let scroll = ((messages.scrollHeight - messages.scrollTop) + 2 == messages.offsetHeight);
  let element = createChatElement(name, time, message);
  if (messages.children.length > 250) {
    messages.removeChild(messages.children[0]);
  }
  if (!mute) messages.appendChild(element);
  if (scroll) messages.scrollTo(0, messages.scrollHeight);
}
function scrollChat(bool) {
  let m = document.getElementById("messages");
  if (bool) m.scrollTo(0, m.scrollHeight);
}
function createUser(name) {
  let id = generateId();
  let element = createUserElement(name, id);
  return {
    "id": id,
    "name": name,
    "element": element
  };
}
function parseChat(message) {
  let messages = document.getElementById("messages");
  let scroll = ((messages.scrollHeight - messages.scrollTop) + 2 == messages.offsetHeight);
  message = message.replace(/\\x27/gi, "'");
  message = message.replace(/\*\*([^*]+)\*\*/gi, "<b>$1</b>");
  message = message.replace(/\%\%([^*]+)\%\%/gi, "<i>$1</i>");
  message = message.replace(/\_\_([^*]+)\_\_/gi, "<u>$1</u>");
  message = message.replace(/\-\-([^*]+)\-\-/gi, "<s>$1</s>");
  message = message.replace(/(##[A-F0-9]{6}|##[A-F0-9]{3})((?:(?!(##[A-F0-9]{6}|##[A-F0-9]{3})).)*)/gi, "<span style=\"background: $1\">$2</span>");
  message = message.replace(/(#[A-F0-9]{6}|#[A-F0-9]{3})((?:(?!(#[A-F0-9]{6}|#[A-F0-9]{3})).)*)/gi, "<span style=\"color: $1\">$2</span>");
  message = message.replace(/&#x2F;/g, "/");
  message = message.replace(/((https?|ftp):\/\/[^\s\/$.?#].[^\s]*)/gi, "<a href=\"$1\" target=\"_blank\">$1</a>");
  message = message.replace(/<a href="(https?):\/\/i\.imgur\.com\/(\w+\.(png|jpe?g|gif|bmp|webp))" target="_blank">(https?):\/\/i\.imgur\.com\/(\w+\.(png|jpe?g|gif|bmp|webp))<\/a>/gi, "<a href=\"$1://i.imgur.com/$2\" target=\"_blank\"><img onload=\"scrollChat(" + (scroll ? "true" : "false") + ");\" class=\"message-image\" src=\"$1://i.imgur.com/$2\" /></a>");
  return message;
}
let vm = (window.location.hash.substr(1) || 1);
if (isNaN(parseInt(vm))) vm = 1;
else vm = parseInt(vm);
client.socket = new WebSocket("ws://computernewb.com:" + (6003 + vm), "guacamole");
client.send = function() {
  let args = [...arguments];
  let message = "";
  for (var i = 0; i < args.length; i++) {
    let str = args[i].toString();
    message += str.length + "." + str;
    if (i < args.length - 1) message += ",";
    else message += ";";
  }
  this.socket.send(message);
};
client.socket.addEventListener("open", () => {
  client.send("rename");
  client.send("connect", "vm" + vm);
});
client.socket.addEventListener("close", () => {
  notifier.warn("Disconnected!", 3000);
});
client.socket.addEventListener("error", (e) => {
  notifier.error(e.message, 5000);
});
client.socket.addEventListener("message", (d) => {
  d = d.data;
  let data = [];
  while (d.length > 1) {
    let num = d.split(".")[0]
    let read = parseInt(num);
    let p = d.substring(num.length + 1, num.length + 1 + read);
    data.push(isNaN(parseFloat(p)) ? p : parseFloat(p));
    d = d.substring(num.length + 2 + read);
  }
  switch (data[0]) {
    case "nop":
      client.socket.send("3.nop;");
      break;
    case "connect":
      if (data[1] == 0) {
        notifier.error("Failed to connect!");
      } else if (data[1] == 1) {
        notifier.success("Connected!", 3000);
      }
      break;
    case "size":
      var layer = data[1];
      if (typeof client.layers[layer] == "undefined") {
        client.layers[layer] = newLayer();
      }
      client.layers[layer].canvas.width = data[2];
      client.layers[layer].canvas.height = data[3];
      client.layers[layer].width = data[2];
      client.layers[layer].height = data[3];
      if (layer == 0) {
        client.canvas.width = data[2];
        client.canvas.height = data[3];
      }
      break;
    case "png":
      let composite = {
        1: "destination-in",
        2: "destination-out",
        4: "source-in",
        6: "source-atop",
        8: "source-out",
        9: "destination-atop",
        10: "xor",
        11: "destination-over",
        12: "copy",
        14: "source-over",
        15: "lighter"
      };
      var layer = data[2];
      if (typeof client.layers[layer] == "undefined") {
        client.layers[layer] = newLayer();
      }
      client.layers[layer].ctx.globalCompositeOperation = composite[data[1]];
      let image = new Image();
      image.src = "data:image/png;base64," + data[5];
      image.onload = function() {
        client.layers[layer].ctx.drawImage(image, data[3], data[4]);
      };
      break;
    case "chat":
      if (data.length > 3) {
        for (var i = 0; i < data.length - 1; i += 2) {
          let name = data[i + 1];
          let message = String(data[i + 2]);
          let element = createChatElement(name, "past", parseChat(message));
          document.getElementById("messages").appendChild(element);
          messages.scrollTo(0, messages.scrollHeight);
        }
      } else {
        let name = data[1];
        let user = getUserByName(name);
        let message = String(data[2]);
        if (user) {
          addChat(user.mute, name, parseChat(message));
        } else {
          addChat(false, message);
        }
      }
      break;
    case "adduser":
      for (var i = 0; i < data[1]; i++) {
        let name = data[(i * 2) + 2];
        let user = createUser(name);
        client.users[user.id] = user;
        if (name == client.name) {
          client.id = user.id;
          user.element.children[0].classList.add("you");
        } else {
          addChat(false, user.name + " has joined.");
        }
      }
      break;
    case "remuser":
      for (var i = 0; i < data[1]; i++) {
        let name = data[(i * 2) + 2];
        let user = getUserByName(name);
        addChat(false, user.name + " has left.");
        user.element.parentNode.removeChild(user.element);
        delete client.users[user.id];
      }
      break;
    case "rename":
      if (data[1] == 0) {
        switch (data[2]) {
          case 0:
            client.name = data[3];
            let user = getUserById(client.id);
            if (user) {
              user.name = data[3];
              user.element.children[0].innerText = data[3];
            }
            addChat(false, "Name set to: " + client.name);
            break;
          case 1:
            notifier.error("That username is already taken.");
            break;
          case 2:
            notifier.error("Usernames can contain only numbers, letters, spaces, dashes, underscores, and dots, and it must be between 3 and 20 characters.");
            break;
        }
      } else if (data[1] == 1) {
        let newname = data[3];
        let oldname = data[2];
        let user = getUserByName(oldname);
        user.name = newname;
        user.element.children[0].innerText = newname;
        addChat(user.mute, oldname + " has changed their name to " + newname);
      }
      break;
    case "turn":
      client.queued = 0;
      let queued = document.getElementsByClassName("queued");
      for (var q = queued.length - 1; q > -1; q--) {
        queued[q].style.order = 0;
        queued[q].classList.remove("queued");
      }
      let turned = document.getElementsByClassName("turn");
      for (var t = turned.length - 1; t > -1; t--) {
        turned[t].style.order = 0;
        turned[t].classList.remove("turn");
      }
      for (var i = 0; i < data[2]; i++) {
        let user = getUserByName(data[3 + i]);
        user.element.style.order = (-data[2]) + i;
        user.element.classList.add("queued");
        if (i == 0) {
          user.element.classList.add("turn");
          if (user.name == client.name) {
            client.queued = 2;
          }
        } else if (user.name == client.name) {
          client.queued = 1;
        }
      }
      client.timers.turn.timeleft = data[1];
      client.timers.turn.start = Date.now();
      break;
    case "move":
      var layer = data[1];
      if (typeof client.layers[layer] == "undefined") {
        client.layers[layer] = newLayer();
      }
      client.layers[layer].x = data[3];
      client.layers[layer].y = data[4];
      break;
    case "sync":
      break;
    case "vote":
      client.reset.ongoing = data[1];
      client.timers.vote.timeleft = data[2];
      client.timers.vote.start = Date.now();
      client.reset.y = data[3];
      client.reset.n = data[4];
      break;
    default:
      notifier.debug(data.join(", "), 500);
      console.log(data.join(", "));
      break;
  }
});
let chatbox = document.getElementById("chatbox");
chatbox.onkeydown = function(e) {
  if (e.keyCode == 13 && chatbox.value.length > 0) {
    client.send("chat", chatbox.value);
    chatbox.value = "";
  }
  chatbox.value = chatbox.value.substring(0, 110);
};
function update() {
  for (var l in client.layers) {
    client.ctx.drawImage(client.layers[l].canvas, client.layers[l].x, client.layers[l].y);
  }
  if (client.reset.ongoing != 2) {
    let buttons = document.getElementsByClassName("reset");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].style.display = "block";
    }
    document.getElementById("voteToReset").innerText = "Reset the VM? Time left: " + Math.max(0, Math.floor((client.timers.vote.timeleft - (Date.now() - client.timers.vote.start)) / 1000));
    document.getElementById("resetYesBtn").innerText = "Yes: " + client.reset.y;
    document.getElementById("resetNoBtn").innerText = "No: " + client.reset.n;
  } else {
    let buttons = document.getElementsByClassName("reset");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].style.display = "none";
    }
  }
  if (client.queued > 0) {
    let queuetimer = document.getElementsByClassName("queuetimer");
    for (var i = 0; i < queuetimer.length; i++) {
      queuetimer[i].style.display = "block";
    }
    let timeleft = Math.max(0, Math.floor((client.timers.turn.timeleft - (Date.now() - client.timers.turn.start)) / 1000));
    document.getElementById("timer").innerText = (client.queued == 1 ? "Waiting for turn in " : "Turn will end in ") +
      timeleft + (timeleft == 1 ? " second" : " seconds");
  } else {
    let queuetimer = document.getElementsByClassName("queuetimer");
    for (var i = 0; i < queuetimer.length; i++) {
      queuetimer[i].style.display = "none";
    }
  }
  window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);
document.getElementById("resetYesBtn").onclick = function() {
  client.send("vote", 1);
};
document.getElementById("resetNoBtn").onclick = function() {
  client.send("vote", 0);
};
client.canvas.addEventListener("mousemove", function(e) {
  e.preventDefault();
  if (client.queued == 2) {
    client.send("mouse", e.offsetX, e.offsetY, client.mouse);
  }
});
client.canvas.addEventListener("mousedown", function(e) {
  e.preventDefault();
  switch (e.button) {
    case 0:
      client.mouse += 1;
      break;
    case 1:
      client.mouse += 2;
      break;
    case 2:
      client.mouse += 4;
      break;
  }
  if (client.queued == 2) {
    client.send("mouse", e.offsetX, e.offsetY, client.mouse);
  } else if (client.queued == 0) {
    client.send("turn");
  }
});
client.canvas.addEventListener("mouseup", function(e) {
  e.preventDefault();
  switch (e.button) {
    case 0:
      client.mouse -= 1;
      break;
    case 1:
      client.mouse -= 2;
      break;
    case 2:
      client.mouse -= 4;
      break;
  }
  if (client.queued == 2) {
    client.send("mouse", e.offsetX, e.offsetY, client.mouse);
  }
});
client.canvas.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});
let keycodes = { // Totally stolen straight from CollabVM's client lol
  Again: [65382],
  AllCandidates: [65341],
  Alphanumeric: [65328],
  Alt: [65513, 65513, 65027],
  Attn: [64782],
  AltGraph: [65027],
  ArrowDown: [65364],
  ArrowLeft: [65361],
  ArrowRight: [65363],
  ArrowUp: [65362],
  Backspace: [65288],
  CapsLock: [65509],
  Cancel: [65385],
  Clear: [65291],
  Convert: [65313],
  Copy: [64789],
  Crsel: [64796],
  CrSel: [64796],
  CodeInput: [65335],
  Compose: [65312],
  Control: [65507, 65507, 65508],
  ContextMenu: [65383],
  DeadGrave: [65104],
  DeadAcute: [65105],
  DeadCircumflex: [65106],
  DeadTilde: [65107],
  DeadMacron: [65108],
  DeadBreve: [65109],
  DeadAboveDot: [65110],
  DeadUmlaut: [65111],
  DeadAboveRing: [65112],
  DeadDoubleacute: [65113],
  DeadCaron: [65114],
  DeadCedilla: [65115],
  DeadOgonek: [65116],
  DeadIota: [65117],
  DeadVoicedSound: [65118],
  DeadSemivoicedSound: [65119],
  Delete: [65535],
  Down: [65364],
  End: [65367],
  Enter: [65293],
  EraseEof: [64774],
  Escape: [65307],
  Execute: [65378],
  Exsel: [64797],
  ExSel: [64797],
  F1: [65470],
  F2: [65471],
  F3: [65472],
  F4: [65473],
  F5: [65474],
  F6: [65475],
  F7: [65476],
  F8: [65477],
  F9: [65478],
  F10: [65479],
  F11: [65480],
  F12: [65481],
  F13: [65482],
  F14: [65483],
  F15: [65484],
  F16: [65485],
  F17: [65486],
  F18: [65487],
  F19: [65488],
  F20: [65489],
  F21: [65490],
  F22: [65491],
  F23: [65492],
  F24: [65493],
  Find: [65384],
  GroupFirst: [65036],
  GroupLast: [65038],
  GroupNext: [65032],
  GroupPrevious: [65034],
  FullWidth: null,
  HalfWidth: null,
  HangulMode: [65329],
  Hankaku: [65321],
  HanjaMode: [65332],
  Help: [65386],
  Hiragana: [65317],
  HiraganaKatakana: [65319],
  Home: [65360],
  Hyper: [65517, 65517, 65518],
  Insert: [65379],
  JapaneseHiragana: [65317],
  JapaneseKatakana: [65318],
  JapaneseRomaji: [65316],
  JunjaMode: [65336],
  KanaMode: [65325],
  KanjiMode: [65313],
  Katakana: [65318],
  Left: [65361],
  Meta: [65511, 65511, 65512],
  ModeChange: [65406],
  NumLock: [65407],
  PageDown: [65366],
  PageUp: [65365],
  Pause: [65299],
  Play: [64790],
  PreviousCandidate: [65342],
  PrintScreen: [64797],
  Redo: [65382],
  Right: [65363],
  RomanCharacters: null,
  Scroll: [65300],
  Select: [65376],
  Separator: [65452],
  Shift: [65505, 65505, 65506],
  SingleCandidate: [65340],
  Super: [65515, 65515, 65516],
  Tab: [65289],
  Up: [65362],
  Undo: [65381],
  Win: [65515],
  Zenkaku: [65320],
  ZenkakuHankaku: [65322]
};
document.addEventListener("keydown", function(e) {
  if (!client.focused) return;
  e.preventDefault();
  if (client.queued == 2) {
    if (keycodes.hasOwnProperty(e.key)) {
      client.send("key", keycodes[e.key], 1);
    } else {
      client.send("key", e.key.charCodeAt(0), 1);
    }
  }
});
document.addEventListener("keyup", function(e) {
  if (!client.focused) return;
  e.preventDefault();
  if (client.queued == 2) {
    if (keycodes.hasOwnProperty(e.key)) {
      client.send("key", keycodes[e.key], 0);
    } else {
      client.send("key", e.key.charCodeAt(0), 0);
    }
  }
});
document.addEventListener("mousedown", function(e) {
  client.focused = (e.target == client.canvas);
});
