import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { vibrate } from "./vibration";
import { playCorrect, playWrong, initializeAudio } from "./audio";

const TOTAL_LIVES = 3;
const INITIAL_DELAY = 1000;
const BOX_SIZE = 60; // pixels
const MIN_DISTANCE = BOX_SIZE + 4; // Add small buffer to avoid visual overlap

function App() {
  const [map] = useState("default");
  const [level, setLevel] = useState(1);
  const [boxes, setBoxes] = useState([]);
  const [showNumbers, setShowNumbers] = useState(true);
  const [userSequence, setUserSequence] = useState([]);
  const [correctSequence, setCorrectSequence] = useState([]);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [feedbackFlash, setFeedbackFlash] = useState(false);
  const [clickedBox, setClickedBox] = useState(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    initializeLevel(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  function generateNonOverlappingPositions(count, containerWidth, containerHeight) {
    const positions = [];

    for (let i = 0; i < count; i++) {
      let pos;
      let attempts = 0;
      do {
        pos = {
          x: Math.random() * (containerWidth - BOX_SIZE),
          y: Math.random() * (containerHeight - BOX_SIZE),
        };
        attempts++;
      } while (
        positions.some(
          (p) =>
            Math.abs(p.x - pos.x) < MIN_DISTANCE &&
            Math.abs(p.y - pos.y) < MIN_DISTANCE
        ) &&
        attempts < 1000
      );
      positions.push(pos);
    }

    return positions.map((p, i) => ({ id: i + 1, ...p }));
  }

  function initializeLevel(currentLevel) {
    const sequence = [...Array(currentLevel)].map((_, i) => i + 1);

    const container = mapRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const positions = generateNonOverlappingPositions(
      currentLevel,
      rect.width,
      rect.height
    );

    const configuredBoxes = sequence.map((num, idx) => ({
      number: num,
      ...positions[idx],
    }));

    setBoxes(configuredBoxes);
    setCorrectSequence(sequence);
    setUserSequence([]);
    setShowNumbers(true);
    setStartTime(Date.now());

    const timer = setTimeout(() => setShowNumbers(false), INITIAL_DELAY + currentLevel * 500);
    return () => clearTimeout(timer);
  }

  function handleBoxClick(num) {
    if (!audioInitialized) {
      initializeAudio();
      setAudioInitialized(true);
    }

    if (gameOver || showNumbers) return;
    vibrate();
    setClickedBox(num);
    setTimeout(() => setClickedBox(null), 200);

    const newSequence = [...userSequence, num];
    setUserSequence(newSequence);

    const currentIndex = newSequence.length - 1;
    if (num !== correctSequence[currentIndex]) {
      vibrate(200);
      playWrong();
      setFeedbackFlash(true);
      setTimeout(() => setFeedbackFlash(false), 300);

      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) {
        setGameOver(true);
        return;
      }

      setUserSequence([]);
      setShowNumbers(true);
      const timer = setTimeout(() => setShowNumbers(false), INITIAL_DELAY + level * 500);
      return () => clearTimeout(timer);
    }

    if (newSequence.length === correctSequence.length) {
      const audio = playCorrect();
      audio.onended = () => {
        const timeTaken = (Date.now() - startTime) / 1000;
        const levelScore = Math.max(1000 - timeTaken * 100, 100);
        setScore((prev) => prev + Math.floor(levelScore));
        setLevel((prev) => prev + 1);
      };
    }
  }

  function resetGame() {
    setLevel(1);
    setLives(TOTAL_LIVES);
    setScore(0);
    setGameOver(false);
    initializeLevel(1);
  }

  return (
    <div className={`game-container ${feedbackFlash ? "flash" : ""}`}>
      <h1>Recall Blitz</h1>
      <div>Map: {map}</div>
      <div>Level: {level}</div>
      <div>Score: {score}</div>
      <div className="lives" aria-label={`Lives: ${lives}`}>
        {[...Array(TOTAL_LIVES)].map((_, i) => (
          <span key={i} className={`heart ${i < lives ? "full" : "empty"}`}>
            {i < lives ? "❤️" : "🐟"}
          </span>
        ))}
      </div>
      {gameOver && <button onClick={resetGame}>Restart Game</button>}
      <div className="map-container" ref={mapRef}>
        {boxes.map((box) => (
          <div
            key={box.number}
            className={`box ${clickedBox === box.number ? "clicked" : ""}`}
            onClick={() => handleBoxClick(box.number)}
            style={{ left: `${box.x}px`, top: `${box.y}px` }}
          >
            {showNumbers ? box.number : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);