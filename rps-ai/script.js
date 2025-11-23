let arduinoPort;
let writer;

async function connectArduino() {
  try {
    arduinoPort = await navigator.serial.requestPort();
    await arduinoPort.open({ baudRate: 9600 });
    writer = arduinoPort.writable.getWriter();
    console.log("Arduino connected!");
  } catch (err) {
    console.error("Arduino connection error:", err);
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "c") {
    connectArduino();
  }
});


let video;
let tmModel = null;

// Labels must match metadata.json, but we convert to lowercase for the game
const TM_LABELS = ["Paper", "Rock", "Scissors", "Unknown"];
const LABELS = ["paper", "rock", "scissors", "unknown"];

const statusEl  = document.getElementById("status");
const yourMoveEl = document.getElementById("your-move");
const aiMoveEl   = document.getElementById("ai-move");
const outcomeEl  = document.getElementById("outcome");
const playBtn    = document.getElementById("play-btn");

const winsEl   = document.getElementById("wins");
const lossesEl = document.getElementById("losses");
const tiesEl   = document.getElementById("ties");

let wins = 0;
let losses = 0;
let ties = 0;

// ---------- CAMERA SETUP ----------
async function setupCamera() {
  console.log("Starting camera…");
  video = document.getElementById("cam");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 320,
      height: 240,
      facingMode: "user"
    },
    audio: false
  });

  video.srcObject = stream;
  await new Promise(res => {
    video.onloadedmetadata = () => {
      video.play();
      res();
    };
  });

  console.log("Camera ready.");
}

// ---------- LOAD TM MODEL ----------
async function loadModel() {
  try {
    console.log("Loading model from ./model/model.json …");
    statusEl.textContent = "Loading model…";

    const modelURL    = "./model/model.json";
    const metadataURL = "./model/metadata.json";

    // tmImage is injected by the Teachable Machine script
    tmModel = await tmImage.load(modelURL, metadataURL);

    console.log("Model loaded:", tmModel);
    statusEl.textContent = "Ready!";
    playBtn.disabled = false;
  } catch (err) {
    console.error("MODEL LOAD ERROR:", err);
    statusEl.textContent = "Model failed to load!";
    playBtn.disabled = true;
  }
}

// ---------- AI MOVE LOGIC ----------
// Balanced so you can win sometimes, lose sometimes, tie sometimes.
function aiMove(userMove) {
  const choices = ["rock", "paper", "scissors"];

  // If model returned "unknown", AI plays random
  if (!choices.includes(userMove)) {
    const idx = Math.floor(Math.random() * choices.length);
    return choices[idx];
  }

  // Outcome mapping if user plays X:
  const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
  const losesTo = { rock: "paper", paper: "scissors", scissors: "rock" };

  const r = Math.random();
  if (r < 0.35) {
    // 35% AI plays randomly
    const idx = Math.floor(Math.random() * choices.length);
    return choices[idx];
  } else if (r < 0.65) {
    // 30% AI plays a losing move (you win)
    return beats[userMove];
  } else {
    // 35% AI plays a winning move (you lose)
    return losesTo[userMove];
  }
}

// ---------- PREDICT GESTURE ----------
async function predictGesture() {
  if (!tmModel) {
    console.error("Model not loaded!");
    statusEl.textContent = "Model not loaded!";
    return "unknown";
  }

  // Your TM metadata says imageSize = 224
  const INPUT_SIZE = 224;
  const canvas = document.createElement("canvas");
  canvas.width  = INPUT_SIZE;
  canvas.height = INPUT_SIZE;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Teachable Machine: returns array of {className, probability}
  const predictions = await tmModel.predict(canvas);

  console.log("Predictions:", predictions);

  let best = predictions[0];
  for (const p of predictions) {
    if (p.probability > best.probability) best = p;
  }

  // Map TM class name (e.g. "Rock") -> "rock"
  const className = best.className;
  const idx = TM_LABELS.indexOf(className);
  if (idx === -1) {
    return "unknown";
  }
  return LABELS[idx]; // lowercase
}

// ---------- PLAY ROUND ----------
async function playRound() {
  if (!tmModel) {
    statusEl.textContent = "Model not loaded!";
    return;
  }

  statusEl.textContent = "Detecting…";

  const userMove = await predictGesture();
  yourMoveEl.textContent = userMove;

  const aiChoice = aiMove(userMove);
  aiMoveEl.textContent = aiChoice;

  let resultText = "";

  if (userMove === "unknown") {
    resultText = "Show a clear rock / paper / scissors.";
  } else if (userMove === aiChoice) {
    resultText = "Tie!";
    ties++;
    tiesEl.textContent = ties.toString();
  } else if (
    (userMove === "rock" && aiChoice === "scissors") ||
    (userMove === "paper" && aiChoice === "rock") ||
    (userMove === "scissors" && aiChoice === "paper")
  ) {
    resultText = "You win!";
    wins++;
    winsEl.textContent = wins.toString();
  } else {
    resultText = "You lose!";
    losses++;
    lossesEl.textContent = losses.toString();
  }

  outcomeEl.textContent = resultText;
// Send outcome to Arduino
if (writer) {
  if (resultText === "You win!") {
    writer.write(new TextEncoder().encode("win\n"));
  } else if (resultText === "You lose!") {
    writer.write(new TextEncoder().encode("lose\n"));
  } else if (resultText === "Tie!") {
    writer.write(new TextEncoder().encode("tie\n"));
  }
}

  statusEl.textContent = "Ready!";
}

// ---------- INIT ----------
(async function init() {
  try {
    await setupCamera();
    await loadModel();
  } catch (err) {
    console.error("INIT ERROR:", err);
    statusEl.textContent = "Initialization failed.";
  }
})();

playBtn.addEventListener("click", playRound);
