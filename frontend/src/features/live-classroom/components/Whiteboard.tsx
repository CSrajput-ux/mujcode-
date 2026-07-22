import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { Socket } from 'socket.io-client';
import { Eraser, Pencil, Trash2, Plus, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface WhiteboardProps {
  socket: Socket | null;
  role: string;
}

export function Whiteboard({ socket, role }: WhiteboardProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing,  setIsDrawing]  = useState(false);
  const [color,      setColor]      = useState('#ffffff');
  const [brushSize,  setBrushSize]  = useState(3);
  const [tool,       setTool]       = useState<'pencil' | 'eraser'>('pencil');

  // Multi-page state
  const [totalPages,   setTotalPages]   = useState(1);
  const [currentPage,  setCurrentPage]  = useState(0);

  // Store each page's canvas data as a dataURL
  const pageDataRef = useRef<Record<number, string>>({});

  const canDraw = role === 'faculty';
  const currentPos = useRef({ x: 0, y: 0 });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number,
    x1: number, y1: number,
    strokeColor: string, size: number, isErase: boolean
  ) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = isErase ? '#1e293b' : strokeColor;
    ctx.lineWidth   = size;
    ctx.lineCap     = 'round';
    ctx.stroke();
    ctx.closePath();
  };

  const getCoordinates = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Save current page to memory
  const savePage = (pageIndex: number) => {
    const canvas = canvasRef.current;
    if (canvas) pageDataRef.current[pageIndex] = canvas.toDataURL();
  };

  // Load a page from memory onto canvas
  const loadPage = (pageIndex: number) => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const saved = pageDataRef.current[pageIndex];
    if (saved) {
      const img  = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src    = saved;
    }
  };

  // ── Socket setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial canvas size
    const resizeCanvas = () => {
      const parent = containerRef.current;
      if (!parent) return;
      const savedData = canvas.toDataURL();
      canvas.width  = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const img  = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src    = savedData;
    };

    if (containerRef.current) {
      canvas.width  = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);

    if (socket) {
      // Remote draw (includes page check)
      socket.on('whiteboard-draw', (data: any) => {
        if (data.pageIndex !== undefined && data.pageIndex !== currentPage) return;
        drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size, data.isErase);
      });

      // Clear current page
      socket.on('whiteboard-clear', (data: any) => {
        if (data?.pageIndex !== undefined && data.pageIndex !== currentPage) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });

      // Faculty switched page → students follow
      socket.on('whiteboard-page-change', ({ pageIndex, total }: { pageIndex: number; total: number }) => {
        if (canDraw) return; // faculty ignores own echo
        savePage(currentPage);   // not really needed for students, but keep consistent
        setCurrentPage(pageIndex);
        setTotalPages(total);
        // Clear and load whatever is stored for this page
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // students start fresh for new page (drawings will come via whiteboard-draw)
      });

      // Faculty added a page → students see total update
      socket.on('whiteboard-add-page', ({ total }: { total: number }) => {
        setTotalPages(total);
      });
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (socket) {
        socket.off('whiteboard-draw');
        socket.off('whiteboard-clear');
        socket.off('whiteboard-page-change');
        socket.off('whiteboard-add-page');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentPage, canDraw]);

  // ── Page navigation (faculty only) ───────────────────────────────────────────
  const goToPage = (newPage: number) => {
    if (!canDraw) return;
    if (newPage < 0 || newPage >= totalPages) return;
    savePage(currentPage);
    setCurrentPage(newPage);
    loadPage(newPage);
    socket?.emit('whiteboard-page-change', { pageIndex: newPage, total: totalPages });
  };

  const addPage = () => {
    if (!canDraw) return;
    savePage(currentPage);
    const newIndex = totalPages;       // 0-based: new page index = old total
    const newTotal = totalPages + 1;
    setTotalPages(newTotal);
    setCurrentPage(newIndex);

    // Clear canvas for new blank page
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

    socket?.emit('whiteboard-add-page',    { total: newTotal });
    socket?.emit('whiteboard-page-change', { pageIndex: newIndex, total: newTotal });
  };

  // ── Drawing events ───────────────────────────────────────────────────────────
  const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    setIsDrawing(true);
    currentPos.current = getCoordinates(e);
  };

  const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canDraw) return;
    const ctx = getCtx();
    if (!ctx) return;
    const newPos  = getCoordinates(e);
    const isErase = tool === 'eraser';
    drawLine(ctx, currentPos.current.x, currentPos.current.y, newPos.x, newPos.y, color, brushSize, isErase);
    socket?.emit('whiteboard-draw', {
      x0: currentPos.current.x, y0: currentPos.current.y,
      x1: newPos.x,             y1: newPos.y,
      color, size: brushSize, isErase,
      pageIndex: currentPage
    });
    currentPos.current = newPos;
  };

  const onMouseUp = () => { if (isDrawing) setIsDrawing(false); };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket?.emit('whiteboard-clear', { pageIndex: currentPage });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">

      {/* ── Drawing Toolbar (faculty only) ─── */}
      {canDraw && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-slate-800/80 border-b border-slate-700">
          {/* Pencil */}
          <button
            onClick={() => setTool('pencil')}
            className={`p-2 rounded-lg transition-colors ${tool === 'pencil' ? 'bg-[#FF7A00] text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            title="Pencil"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Eraser */}
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-[#FF7A00] text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-600" />

          {/* Color */}
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            disabled={tool === 'eraser'}
            title="Pen Color"
          />

          {/* Brush Size */}
          <input
            type="range" min="1" max="20"
            value={brushSize}
            onChange={e => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-[#FF7A00]"
            title="Brush Size"
          />

          <div className="w-px h-6 bg-slate-600" />

          {/* Clear current page */}
          <button
            onClick={clearBoard}
            className="p-2 rounded-lg text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
            title="Clear This Page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Canvas ─────────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`relative flex-1 w-full bg-[#1e293b] ${canDraw ? 'cursor-crosshair' : 'cursor-default'}`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseOut={onMouseUp}
          className="block"
          style={{ pointerEvents: canDraw ? 'auto' : 'none' }}
        />

        {/* Student hint */}
        {!canDraw && (
          <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-400 flex items-center gap-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Watching faculty&apos;s board
          </div>
        )}
      </div>

      {/* ── Page Navigation Bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-t border-slate-700">

        {/* Left: page counter label */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <FileText className="w-3.5 h-3.5" />
          <span>Page <span className="text-white font-semibold">{currentPage + 1}</span> / {totalPages}</span>
        </div>

        {/* Centre: page dots + prev/next */}
        <div className="flex items-center gap-2">
          {/* Prev arrow */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0 || !canDraw}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                disabled={!canDraw}
                title={`Page ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === currentPage
                    ? 'w-5 h-2.5 bg-[#FF7A00]'
                    : 'w-2.5 h-2.5 bg-slate-600 hover:bg-slate-400'
                } disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || !canDraw}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Add Page button (faculty only) */}
        {canDraw ? (
          <button
            onClick={addPage}
            className="flex items-center gap-1.5 bg-[#FF7A00] hover:bg-[#e66a00] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-orange-500/30 active:scale-95"
            title="Add New Page"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Page
          </button>
        ) : (
          /* Students see a read-only placeholder on the right */
          <div className="text-xs text-slate-600 select-none">Read-only</div>
        )}
      </div>
    </div>
  );
}
