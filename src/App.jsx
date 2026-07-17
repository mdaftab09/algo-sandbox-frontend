import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, RefreshCw } from 'lucide-react';
// Using esm.sh imports so the Canvas preview works correctly!
import { Client } from 'https://esm.sh/@stomp/stompjs';
import SockJS from 'https://esm.sh/sockjs-client';

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
          webSocketFactory: () => new SockJS('https://algo-sandbox-backend.onrender.com/ws-sandbox'),
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
      type: 'array', endpoint: 'https://algo-sandbox-backend.onrender.com/api/v1/visualize/sort/bubble',
      time: 'O(n²)', space: 'O(1)',
      code: [
        { line: 1, text: "for i = 0 to n-1" },
        { line: 2, text: "  for j = 0 to n-i-1" },
        { line: 3, text: "    if array[j] > array[j+1]" },
        { line: 4, text: "      swap(array[j], array[j+1])" }
      ]
    },
    quick: {
      type: 'array', endpoint: 'https://algo-sandbox-backend.onrender.com/api/v1/visualize/sort/quick',
      time: 'O(n log n)', space: 'O(log n)',
      code: [
        { line: 1, text: "if (low < high)" },
        { line: 2, text: "  pivot = partition(arr, low, high)" },
        { line: 3, text: "  quickSort(arr, low, pivot - 1)" },
        { line: 4, text: "  quickSort(arr, pivot + 1, high)" }
      ]
    },
    bst: {
      type: 'tree', endpoint: 'https://algo-sandbox-backend.onrender.com/api/v1/visualize/tree/bst',
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
      type: 'graph', endpoint: 'https://algo-sandbox-backend.onrender.com/api/v1/visualize/graph/dijkstra',
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
    
    // ADDED: UI Feedback so you know it's not dead!
    setInputError("Waking up Cloud Engine... (Takes ~40s on first run)");

    const parsedArray = arrayInput.split(',').map(num => parseInt(num.trim(), 10));
    const config = algoConfigs[algorithm];
    
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.type === 'array' || config.type === 'tree' ? parsedArray : [])
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setInputError(""); // Clear loading message on success
      
      if (config.type === 'array') {
        const data = await response.json();
        setSteps(data);
        setCurrentStepIndex(0);
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
      // ADDED: UI Error message for CORS or Server failures
      setInputError("Connection failed! Press F12 and check Console for CORS errors.");
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