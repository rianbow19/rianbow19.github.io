let audioContext;
const soundBuffers = new Map();
const volume = 0.4;

// 初始化音訊系統
const initAudioContext = () => {
  return new Promise((resolve) => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // iOS 解鎖音訊
      const unlockAudio = () => {
        if (audioContext.state === "suspended") {
          audioContext.resume().then(resolve);
        } else {
          resolve();
        }
        document.removeEventListener("touchstart", unlockAudio);
      };

      document.addEventListener("touchstart", unlockAudio, { once: true });

      // 如果音訊上下文已經在運行，立即解析
      if (audioContext.state === "running") {
        resolve();
      }
    } else {
      resolve();
    }
  });
};

// 載入音效
const loadSound = async (url) => {
  if (soundBuffers.has(url)) {
    return soundBuffers.get(url);
  }

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  soundBuffers.set(url, audioBuffer);
  return audioBuffer;
};

// 播放音效
const playBuffer = (buffer, volume) => {
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();

  source.buffer = buffer;
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);

  return source;
};

// 初始化所有遊戲音效
export const gameSound = {
  readyGo: "sounds/ready_go.m4a",
  cut: "sounds/shu.m4a",
  correct: "sounds/correct.m4a",
  wrong: "sounds/wrong.m4a",
  winRank: "sounds/win_rank.mp3",
  uhOh: "sounds/uh_oh.mp3",
  select: "sounds/select.m4a",
  button: "sounds/button.m4a",
  change: "sounds/change.m4a",
  timeUp: "sounds/bi.m4a",
  robotCityBGM: "sounds/RobotCity.m4a",
};

let bgmSource = null;
let bgmGainNode = null;

// BGM 控制函數
export const playBGM = async () => {
  if (!audioContext) await initAudioContext();
  if (bgmSource) return; // 已經在播放

  const buffer = await loadSound(gameSound.robotCityBGM);
  bgmSource = audioContext.createBufferSource();
  bgmGainNode = audioContext.createGain();

  bgmSource.buffer = buffer;
  bgmSource.loop = true;
  bgmGainNode.gain.value = volume * 0.3; // 降低 BGM 音量

  bgmSource.connect(bgmGainNode);
  bgmGainNode.connect(audioContext.destination);
  bgmSource.start(0);
};

export const stopBGM = () => {
  if (bgmSource) {
    bgmSource.stop();
    bgmSource = null;
  }
};

export const setBGMVolume = (value) => {
  if (bgmGainNode) {
    bgmGainNode.gain.value = value * 0.3;
  }
};

// 預載所有音效
export const preloadSounds = async () => {
  initAudioContext();
  const loadPromises = Object.values(gameSound).map((url) => loadSound(url));
  await Promise.all(loadPromises);
};

export const playSound = async (soundKey) => {
  if (!audioContext) await initAudioContext();
  const url = gameSound[soundKey];
  const buffer = await loadSound(url);
  const gainValue =
    soundKey === "cut"
      ? volume * 1.2
      : soundKey === "correct"
      ? volume * 0.4
      : soundKey === "wrong"
      ? volume * 0.9
      : soundKey === "timeUp"
      ? volume * 0.6
      : volume;
  return playBuffer(buffer, gainValue);
};

export const playChangeSound = async () => {
  return playSound("change");
};
