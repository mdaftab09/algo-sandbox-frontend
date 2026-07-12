import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, RefreshCw } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function App() {
  const [algorithm, setAlgorithm] = useState("bubble"); 
  const [arrayInput, setArrayInput] = useState("4, 2, 7, 1, 9, 3");
  const [inputError, setInputError] = useState("");
  
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);

  const [treeState, setTreeState] = useState(null);
  const [gridState, setGridState] = useState(null);

  useEffect(() => {
      const stompClient = new Client({
          webSocketFactory: () => new SockJS('http://localhost:8080/ws-sandbox'),
          onConnect: () => {
              console.log("Connected to WebSocket!");
              stompClient.subscribe('/topic/algorithm-stream', (message) => {
                  try {
                      const data = JSON.parse(message.body);
                      if (data.nodes) setTreeState(data);
                      else if (data.grid) setGridState(data);
                  } catch (e) {
                      console.log("Status update:", message.body);
                  }
              });
          },
          onStompError: (frame) => console.error('Broker error: ' + frame.headers['message'])
      });
      stompClient.activate();
      return () => stompClient.deactivate();
  }, []);

  const algoConfigs = {
    bubble: {
      type: 'array', endpoint: 'http://localhost:8080/api/v1/visualize/sort/bubble',
      time: 'O(n²)', space: 'O(1)',
      code: [
        { line: 1, text: "for i = 0 to n-1" },
        { line: 2, text: "  for j = 0 to n-i-1" },
        { line: 3, text: "    if array[j] > array[j+1]" },
        { line: 4, text: "      swap(array[j], array[j+1])" }
      ]
    },
    quick: {
      type: 'array', endpoint: 'http://localhost:8080/api/v1/visualize/sort/quick',
      time: 'O(n log n)', space: 'O(log n)',
      code: [
        { line: 1, text: "if (low < high)" },
        { line: 2, text: "  pivot = partition(arr, low, high)" },
        { line: 3, text: "  quickSort(arr, low, pivot - 1)" },
        { line: 4, text: "  quickSort(arr, pivot + 1, high)" }
      ]
    },
    bst: {
      type: 'tree', endpoint: 'http://localhost:8080/api/v1/visualize/tree/bst',
      time: 'O(log n)', space: 'O(n)',
      code: [
        { line: 1, text: "for each value in input:" },
        { line: 2, text: "  if root is null, create root" },
        { line: 3, text: "  else compare value with current node" },
        { line: 4, text: "    if smaller, go left" },
        { line: 5, text: "    if larger, go right" }
      ]
    },
    dijkstra: {
      type: 'graph', endpoint: 'http://localhost:8080/api/v1/visualize/graph/dijkstra',
      time: 'O(V + E log V)', space: 'O(V)',
      code: [
        { line: 1, text: "set all distances to infinity" },
        { line: 2, text: "set start node distance to 0" },
        { line: 3, text: "while unvisited nodes exist:" },
        { line: 4, text: "  current = node with min distance" },
        { line: 5, text: "  for each unvisited neighbor:" },
        { line: 6, text: "    calculate new distance" },
        { line: 7, text: "    update if new < current" }
      ]
    }
  };

  const generateRandomArray = () => {
    const length = Math.floor(Math.random() * 3) + 6;
    const randomNums = Array.from({ length }, () => Math.floor(Math.random() * 50) + 1);
    setArrayInput(randomNums.join(", "));
    setInputError(""); 
  };

  const validateAndSetInput = (value) => {
    setArrayInput(value);
    const isValid = /^[\d,\s]+$/.test(value);
    if (!isValid && value.length > 0) setInputError("Only numbers and commas are allowed.");
    else setInputError("");
  };

  const runAlgorithm = async (e) => {
    if (e && e.currentTarget) e.currentTarget.blur();
    setIsPlaying(false);
    setTreeState(null);
    setGridState(null);
    const parsedArray = arrayInput.split(',').map(num => parseInt(num.trim(), 10));
    const config = algoConfigs[algorithm];
    
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.type === 'array' || config.type === 'tree' ? parsedArray : [])
      });
      if (config.type === 'array') {
        const data = await response.json();
        setSteps(data);
        setCurrentStepIndex(0);
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
    }
  };

  useEffect(() => {
    let timer;
    if (isPlaying && currentStepIndex < steps.length - 1 && algoConfigs[algorithm].type === 'array') {
      timer = setTimeout(() => setCurrentStepIndex(prev => prev + 1), speed);
    } else if (currentStepIndex >= steps.length - 1) setIsPlaying(false);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps, speed, algorithm]);

  const currentConfig = algoConfigs[algorithm];
  let activeData = null;
  if (currentConfig.type === 'array') activeData = steps[currentStepIndex];
  if (currentConfig.type === 'tree') activeData = treeState;
  if (currentConfig.type === 'graph') activeData = gridState;
  const activeLine = activeData ? activeData.activeLine : 0;
  const description = activeData ? activeData.description : "Select an algorithm and click Initialize";

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <div className="w-80 bg-slate-800 p-6 flex flex-col gap-6 shadow-xl z-10 border-r border-slate-700">
        <h1 className="text-2xl font-bold text-blue-400">Algo Sandbox</h1>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400">Algorithm</label>
          <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="bg-slate-700 p-2 rounded outline-none border border-slate-600 focus:border-blue-500">
            <option value="bubble">Bubble Sort</option>
            <option value="quick">Quick Sort</option>
            <option value="bst">Binary Search Tree (Live)</option>
            <option value="dijkstra">Dijkstra's Pathfinding (Live)</option>
          </select>
        </div>
        {currentConfig.type !== 'graph' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-slate-400">Input Data</label>
              <button onClick={generateRandomArray} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Generate Random</button>
            </div>
            <input type="text" value={arrayInput} onChange={(e) => validateAndSetInput(e.target.value)} className={`bg-slate-700 p-2 rounded outline-none border transition-colors ${inputError ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-blue-500'}`} />
            {inputError && <span className="text-xs text-red-500 font-semibold">{inputError}</span>}
          </div>
        )}
        <button onClick={runAlgorithm} disabled={inputError.length > 0} className={`py-3 rounded font-bold transition-all shadow-lg ${inputError ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
          Initialize Visualizer
        </button>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-900 relative overflow-hidden">
          {currentConfig.type === 'array' && activeData && activeData.arrayState && (
             <div className="flex items-end gap-2 h-64 z-10">
             {activeData.arrayState.map((value, idx) => (
                 <motion.div key={idx} layout transition={{ type: "spring", stiffness: 300, damping: 25 }} className={`w-14 flex items-end justify-center rounded-t-md shadow-lg ${activeData.activeIndices.includes(idx) ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ height: `${value * 20}px`, minHeight: '35px' }}>
                   <span className="mb-2 font-bold text-lg">{value}</span>
                 </motion.div>
             ))}
           </div>
          )}
          {currentConfig.type === 'tree' && treeState && (
             <div className="absolute inset-0 w-full h-full">
               <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                 {treeState.edges.map((edge) => {
                   const fromNode = treeState.nodes.find(n => n.id === edge.fromId);
                   const toNode = treeState.nodes.find(n => n.id === edge.toId);
                   if (!fromNode || !toNode) return null;
                   return <motion.line key={`${edge.fromId}-${edge.toId}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5 }} x1={`${fromNode.position}%`} y1={`${fromNode.level}%`} x2={`${toNode.position}%`} y2={`${toNode.level}%`} stroke="#475569" strokeWidth="4" />
                 })}
               </svg>
               {treeState.nodes.map(node => (
                   <motion.div key={node.id} layout initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-xl z-10 border-2 ${treeState.activeNodeId === node.id ? 'bg-orange-500 border-orange-300' : 'bg-blue-600 border-blue-400'}`} style={{ left: `${node.position}%`, top: `${node.level}%` }}>{node.value}</motion.div>
               ))}
             </div>
          )}
          
          {/* UPDATED GRAPH GRID: Perfect squares and Wall styling */}
          {currentConfig.type === 'graph' && gridState && (
              <div className="grid gap-[2px] bg-slate-700 p-[2px] rounded border-4 border-slate-800 shadow-2xl z-10 w-full max-w-4xl mt-16" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
                  {gridState.grid.map((node) => {
                      let cellColor = "bg-slate-800"; 
                      if (node.isWall) cellColor = "bg-slate-950"; // Dark walls
                      else if (node.isPath) cellColor = "bg-yellow-400"; // Shortest Path
                      else if (node.isVisited) cellColor = "bg-blue-500"; // Visited Wave
                      
                      // Start and End always overwrite other colors
                      if (node.isStart) cellColor = "bg-green-500"; 
                      if (node.isEnd) cellColor = "bg-red-500"; 

                      return (
                        <motion.div 
                          key={`${node.row}-${node.col}`} 
                          initial={node.isVisited || node.isPath || node.isWall ? { scale: 0.3, opacity: 0 } : false} 
                          animate={{ scale: 1, opacity: 1 }} 
                          transition={{ duration: 0.2 }} 
                          // NOTE the 'aspect-square w-full h-full' here for perfect boxes!
                          className={`w-full h-full aspect-square rounded-sm ${cellColor}`} 
                        />
                      );
                  })}
              </div>
          )}

          {!activeData && <div className="text-slate-500 text-lg flex flex-col items-center gap-4"><span>Select an algorithm and click Initialize</span></div>}
        </div>
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-6 py-2 rounded-full border border-slate-700 text-sm shadow-lg text-orange-400 font-semibold z-20 whitespace-nowrap">{description}</div>
        <div className="h-24 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-12 z-20 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
          <div className={`flex items-center gap-4 ${currentConfig.type !== 'array' ? 'opacity-30 pointer-events-none' : ''}`}>
            <button onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors"><SkipBack size={20} /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30">{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
            <button onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors"><SkipForward size={20} /></button>
            <button onClick={() => setCurrentStepIndex(0)} className="p-2 ml-4 text-slate-400 hover:text-white transition-colors"><RefreshCw size={20} /></button>
          </div>
          {currentConfig.type !== 'array' && <span className="text-emerald-400 font-mono text-sm animate-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>LIVE WEBSOCKET STREAM</span>}
          <div className={`flex items-center gap-4 ${currentConfig.type !== 'array' ? 'opacity-30 pointer-events-none' : ''}`}>
            <label className="text-sm font-semibold text-slate-400">Speed</label>
            <input type="range" min="200" max="2000" step="100" value={2200 - speed} onChange={(e) => setSpeed(2200 - e.target.value)} className="cursor-pointer accent-blue-500" />
          </div>
        </div>
      </div>

      <div className="w-80 bg-slate-800 p-6 flex flex-col gap-6 shadow-xl z-10 border-l border-slate-700">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Complexity</h2>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">Time</span><span className="font-mono text-blue-400">{currentConfig.time}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Space</span><span className="font-mono text-green-400">{currentConfig.space}</span></div>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Execution Code</h2>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 font-mono text-sm flex flex-col gap-1 overflow-x-auto">
            {currentConfig.code.map((code) => (
              <div key={code.line} className={`py-1 px-2 rounded whitespace-pre transition-colors duration-200 ${activeLine === code.line ? 'bg-blue-600/30 text-blue-300 border-l-2 border-blue-500' : 'text-slate-500 border-l-2 border-transparent'}`}>{code.text}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}