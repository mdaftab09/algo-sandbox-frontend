import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, RefreshCw } from 'lucide-react';
// 1. NEW IMPORTS PLACED AT THE VERY TOP
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function App() {
  const [algorithm, setAlgorithm] = useState("bubble"); 
  const [arrayInput, setArrayInput] = useState("4, 2, 7, 1, 9, 3");
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);

  // 2. NEW WEBSOCKET CONNECTION PLACED INSIDE THE APP FUNCTION
  useEffect(() => {
      const stompClient = new Client({
          webSocketFactory: () => new SockJS('http://localhost:8080/ws-sandbox'),
          onConnect: () => {
              console.log("Connected to WebSocket!");
              stompClient.subscribe('/topic/algorithm-stream', (message) => {
                  console.log("Stream received:", message.body);
              });
          },
          onStompError: (frame) => {
              console.error('Broker error: ' + frame.headers['message']);
          }
      });

      stompClient.activate();
      return () => stompClient.deactivate();
  }, []);

  const algoConfigs = {
    bubble: {
      endpoint: 'http://localhost:8080/api/v1/visualize/sort/bubble',
      time: 'O(n²)',
      space: 'O(1)',
      code: [
        { line: 1, text: "for i = 0 to n-1" },
        { line: 2, text: "  for j = 0 to n-i-1" },
        { line: 3, text: "    if array[j] > array[j+1]" },
        { line: 4, text: "      swap(array[j], array[j+1])" }
      ]
    },
    quick: {
      endpoint: 'http://localhost:8080/api/v1/visualize/sort/quick',
      time: 'O(n log n)',
      space: 'O(log n)',
      code: [
        { line: 1, text: "if (low < high)" },
        { line: 2, text: "  pivot = partition(arr, low, high)" },
        { line: 3, text: "  quickSort(arr, low, pivot - 1)" },
        { line: 4, text: "  quickSort(arr, pivot + 1, high)" }
      ]
    }
  };

  const runAlgorithm = async () => {
    setIsPlaying(false);
    const parsedArray = arrayInput.split(',').map(num => parseInt(num.trim(), 10));
    
    try {
      const response = await fetch(algoConfigs[algorithm].endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedArray)
      });
      const data = await response.json();
      setSteps(data);
      setCurrentStepIndex(0);
    } catch (error) {
      console.error("Error connecting to backend:", error);
    }
  };

  // Playback Loop
  useEffect(() => {
    let timer;
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, speed);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps, speed]);

  const currentStep = steps[currentStepIndex];
  const activeLine = currentStep ? currentStep.activeLine : 0;
  const currentConfig = algoConfigs[algorithm];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-slate-800 p-6 flex flex-col gap-6 shadow-xl z-10 border-r border-slate-700">
        <h1 className="text-2xl font-bold text-blue-400">Algo Sandbox</h1>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400">Algorithm</label>
          <select 
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="bg-slate-700 p-2 rounded outline-none border border-slate-600 focus:border-blue-500"
          >
            <option value="bubble">Bubble Sort</option>
            <option value="quick">Quick Sort</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400">Array Input</label>
          <input 
            type="text" 
            value={arrayInput}
            onChange={(e) => setArrayInput(e.target.value)}
            className="bg-slate-700 p-2 rounded outline-none border border-slate-600 focus:border-blue-500"
          />
        </div>

        <button 
          onClick={runAlgorithm}
          className="bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold transition-colors shadow-lg"
        >
          Initialize Visualizer
        </button>
      </div>

      {/* MIDDLE: Visual Arena */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 flex items-center justify-center p-12 bg-slate-900">
          {currentStep ? (
             <div className="flex items-end gap-2 h-64">
             {currentStep.arrayState.map((value, idx) => {
               const isActive = currentStep.activeIndices.includes(idx);
               return (
                 <motion.div
                   key={idx}
                   layout
                   transition={{ type: "spring", stiffness: 300, damping: 25 }}
                   className={`w-14 flex items-end justify-center rounded-t-md shadow-lg ${isActive ? 'bg-orange-500' : 'bg-blue-500'}`}
                   style={{ height: `${value * 20}px`, minHeight: '35px' }}
                 >
                   <span className="mb-2 font-bold text-lg">{value}</span>
                 </motion.div>
               );
             })}
           </div>
          ) : (
            <div className="text-slate-500 text-lg flex flex-col items-center gap-4">
               <span>Enter data and click Initialize</span>
            </div>
          )}
        </div>

        {/* Status Bubble */}
        {currentStep && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-6 py-2 rounded-full border border-slate-700 text-sm shadow-lg text-orange-400 font-semibold">
                {currentStep.description}
            </div>
        )}

        {/* Playback Controls */}
        <div className="h-24 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-12 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
              <SkipBack size={20} />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
              <SkipForward size={20} />
            </button>
            <button onClick={() => setCurrentStepIndex(0)} className="p-2 ml-4 text-slate-400 hover:text-white transition-colors">
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-slate-400">Speed</label>
            <input type="range" min="200" max="2000" step="100" value={2200 - speed} onChange={(e) => setSpeed(2200 - e.target.value)} className="cursor-pointer accent-blue-500" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Code & Complexity */}
      <div className="w-80 bg-slate-800 p-6 flex flex-col gap-6 shadow-xl z-10 border-l border-slate-700">
        
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Complexity</h2>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Time</span>
              <span className="font-mono text-blue-400">{currentConfig.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Space</span>
              <span className="font-mono text-green-400">{currentConfig.space}</span>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Execution Code</h2>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 font-mono text-sm flex flex-col gap-1 overflow-x-auto">
            {currentConfig.code.map((code) => (
              <div 
                key={code.line} 
                className={`py-1 px-2 rounded whitespace-pre transition-colors duration-200 ${
                  activeLine === code.line 
                    ? 'bg-blue-600/30 text-blue-300 border-l-2 border-blue-500' 
                    : 'text-slate-500 border-l-2 border-transparent'
                }`}
              >
                {code.text}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}