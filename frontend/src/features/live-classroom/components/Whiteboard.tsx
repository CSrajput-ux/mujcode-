import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { Socket } from 'socket.io-client';
import { Eraser, Pencil, Square, Circle, Type, Trash2 } from 'lucide-react';

interface WhiteboardProps {
  socket: Socket | null;
  role: string;
}

export function Whiteboard({ socket, role }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  // Can the user draw? (Only faculty for now, or anyone if we allow it. Let's say all for simplicity, or just faculty)
  const canDraw = role === 'faculty';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial size
    const resizeCanvas = () => {
      const parent = containerRef.current;
      if (parent) {
        // Keep previous drawing
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        ctx.putImageData(imgData, 0, 0);
      }
    };
    
    // Initial size
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);

    // Socket listeners
    if (socket) {
      socket.on('whiteboard-draw', (data: any) => {
        const { x0, y0, x1, y1, color, size, isErase } = data;
        drawLine(ctx, x0, y0, x1, y1, color, size, isErase);
      });

      socket.on('whiteboard-clear', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (socket) {
        socket.off('whiteboard-draw');
        socket.off('whiteboard-clear');
      }
    };
  }, [socket]);

  // Position tracking
  const currentPos = useRef({ x: 0, y: 0 });

  const drawLine = (
    ctx: CanvasRenderingContext2D, 
    x0: number, y0: number, 
    x1: number, y1: number, 
    color: string, size: number, 
    isErase: boolean
  ) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = isErase ? '#0f172a' : color; // Slate-900 for background erasure
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();
  };

  const getCoordinates = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    setIsDrawing(true);
    const pos = getCoordinates(e);
    currentPos.current = pos;
  };

  const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canDraw) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const newPos = getCoordinates(e);
    const isErase = tool === 'eraser';

    drawLine(ctx, currentPos.current.x, currentPos.current.y, newPos.x, newPos.y, color, brushSize, isErase);

    if (socket) {
      socket.emit('whiteboard-draw', {
        x0: currentPos.current.x,
        y0: currentPos.current.y,
        x1: newPos.x,
        y1: newPos.y,
        color,
        size: brushSize,
        isErase
      });
    }

    currentPos.current = newPos;
  };

  const onMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) {
      socket.emit('whiteboard-clear');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
      
      {/* Toolbar (Only visible to those who can draw) */}
      {canDraw && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3 z-10 shadow-lg">
          <button 
            onClick={() => setTool('pencil')}
            className={`p-2 rounded-lg ${tool === 'pencil' ? 'bg-[#FF7A00] text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-[#FF7A00] text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <Eraser className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-slate-600 mx-1"></div>
          
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            disabled={tool === 'eraser'}
          />
          
          <input 
            type="range" 
            min="1" max="20" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-[#FF7A00]"
          />

          <div className="w-px h-6 bg-slate-600 mx-1"></div>

          <button 
            onClick={clearBoard}
            className="p-2 rounded-lg text-red-400 hover:bg-slate-700 hover:text-red-300"
            title="Clear Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full h-full cursor-crosshair bg-[#0f172a]"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseOut={onMouseUp}
          className="block"
        />
      </div>
    </div>
  );
}
