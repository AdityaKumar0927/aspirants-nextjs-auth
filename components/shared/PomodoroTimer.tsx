"use client";

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faPauseCircle,
  faStopCircle
} from "@fortawesome/free-solid-svg-icons";
import interact from "interactjs";

interface PomodoroTimerProps {
  show: boolean;
  hide: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ show, hide }) => {
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const pomodoroRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerRef.current) {
      interact(timerRef.current)
        .draggable({
          inertia: true,
          onmove: (event) => {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;

            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', y.toString());
          }
        })
        .resizable({
          edges: { left: true, right: true, bottom: true, top: true },
          inertia: true,
        })
        .on('resizemove', (event) => {
          const target = event.target;
          let x = (parseFloat(target.getAttribute('data-x')) || 0);
          let y = (parseFloat(target.getAttribute('data-y')) || 0);

          target.style.width = event.rect.width + 'px';
          target.style.height = event.rect.height + 'px';

          x += event.deltaRect.left;
          y += event.deltaRect.top;

          target.style.transform = `translate(${x}px, ${y}px)`;

          target.setAttribute('data-x', x.toString());
          target.setAttribute('data-y', y.toString());
        });
    }
  }, []);

  const startPomodoro = () => {
    setIsPomodoroRunning(true);
    pomodoroRef.current = setInterval(() => {
      setPomodoroTime((prev) => {
        if (prev > 0) return prev - 1;
        else {
          clearInterval(pomodoroRef.current as NodeJS.Timeout);
          setIsPomodoroRunning(false);
          return 0;
        }
      });
    }, 1000);
  };

  const pausePomodoro = () => {
    if (pomodoroRef.current) clearInterval(pomodoroRef.current);
    setIsPomodoroRunning(false);
  };

  const resetPomodoro = () => {
    if (pomodoroRef.current) clearInterval(pomodoroRef.current);
    setPomodoroTime(25 * 60);
    setIsPomodoroRunning(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!show || hide) return null; // Hide the timer if `show` is false or `hide` is true

  return (
    <div ref={timerRef} className="pomodoro-timer" style={{ display: show && !hide ? 'block' : 'none' }}>
      <div>
        <h2>Pomodoro Timer</h2>
        <p className="text-4xl font-mono">{formatTime(pomodoroTime)}</p>
        <div className="pomodoro-controls">
          {isPomodoroRunning ? (
            <button
              className="text-red-600 hover:text-red-800"
              onClick={pausePomodoro}
            >
              <FontAwesomeIcon icon={faPauseCircle} size="2x" />
            </button>
          ) : (
            <button
              className="text-green-600 hover:text-green-800"
              onClick={startPomodoro}
            >
              <FontAwesomeIcon icon={faPlayCircle} size="2x" />
            </button>
          )}
          <button
            className="text-blue-600 hover:text-blue-800"
            onClick={resetPomodoro}
          >
            <FontAwesomeIcon icon={faStopCircle} size="2x" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
