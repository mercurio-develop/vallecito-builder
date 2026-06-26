import { useRef, useState, useEffect, useCallback, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTrip } from "@/lib/store/trip-context"
import { usePreferences } from "@/lib/store/preferences-context"
import { cn } from "@/lib/utils"
import { Drawer } from "vaul"

interface ThreePaneLayoutProps {
  sidebar: ReactNode
  content: ReactNode
  map?: ReactNode
  showMap?: boolean
  className?: string
}

export function ThreePaneLayout({
  sidebar,
  content,
  map,
  showMap = true,
  className
}: ThreePaneLayoutProps) {
  const { leftWidth, setLeftWidth, panelMode, setPanelMode } = useTrip()
  const { isChatOpen, setIsChatOpen } = usePreferences()
  const [isDragging, setIsDragging] = useState(false)
  const [snap, setSnap] = useState<number | string | null>(0.5)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    const containerWidth = containerRef.current.offsetWidth
    const newWidth = (e.clientX / containerWidth) * 100
    if (newWidth >= 20 && newWidth <= 80) {
      setLeftWidth(newWidth)
      window.dispatchEvent(new Event('resize'))
    }
  }, [isDragging, setLeftWidth])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Trigger map resize when layout changes
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 300)
    return () => clearTimeout(timer)
  }, [showMap, leftWidth])

  return (
    <div ref={containerRef} className={cn("h-[calc(100vh-56px)] w-full flex overflow-hidden bg-white font-sans relative", className)}>
      {/* Desktop Left / Main Content Panel */}
      <div 
        style={{ 
          width: showMap ? `calc(${leftWidth}% - 4px)` : '100%',
          minWidth: showMap ? '320px' : '100%',
        }}
        className={cn(
          "transition-none hidden md:flex flex-col h-full relative z-10 bg-white",
          showMap ? "w-full" : "w-full"
        )}
      >
        {/* Sidebar (Header/Search) */}
        <div className="shrink-0">
           {sidebar}
        </div>

        {/* Primary Content (Scrollable Area) */}
        <div className="flex-1 overflow-hidden flex flex-col">
           {content}
        </div>
      </div>

      {/* Resizer */}
      {showMap && (
        <div 
          onMouseDown={() => setIsDragging(true)}
          className="hidden md:flex w-2 bg-gray-50 hover:bg-rose-400 active:bg-rose-600 cursor-col-resize z-20 items-center justify-center border-x border-gray-100 transition-colors"
        >
          <div className="h-8 w-0.5 bg-gray-200 rounded-full" />
        </div>
      )}

      {/* Map Panel (Full screen on mobile) */}
      {map && (
        <div 
          className={cn(
            "transition-none flex flex-col relative z-0 bg-slate-100 flex-1",
            "md:[--map-width:calc(100%-4px-var(--left-width))]",
            !showMap ? "hidden" : ""
          )}
          style={{ 
            '--left-width': `${leftWidth}%`, 
            '--map-width': showMap ? 'calc(100% - var(--left-width))' : '0%',
            width: 'var(--map-width)'
          } as any}
        >
          {showMap && map}
        </div>
      )}

      {/* Mobile Drawer */}
      <div className="md:hidden">
        <Drawer.Root dismissible={false} open={true} modal={false} snapPoints={[0.15, 0.5, 0.9]} activeSnapPoint={snap} setActiveSnapPoint={setSnap}>
          <Drawer.Portal>
            <Drawer.Content 
              className="md:hidden bg-white flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-40 outline-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100"
              style={{ pointerEvents: 'auto', height: '90vh' }}
            >
              <Drawer.Title className="sr-only">Menu</Drawer.Title>
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mt-4 mb-2" />
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="shrink-0 overflow-x-hidden">
                  {sidebar}
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                  {content}
                </div>
              </div>

              {/* Bottom Tab Bar (Mobile) */}
              <div className="shrink-0 h-[72px] border-t border-gray-100 bg-white flex items-center justify-around px-6 pb-2">
                 <button onClick={() => setPanelMode('categories')} className="flex flex-col items-center gap-1 w-20">
                   <div className={cn("p-2 rounded-xl transition-all", panelMode === 'categories' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                   </div>
                   <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", panelMode === 'categories' ? "text-slate-900" : "text-slate-400")}>Discover</span>
                 </button>

                 <button onClick={() => setIsChatOpen(!isChatOpen)} className="flex flex-col items-center gap-1 -mt-4 w-20">
                   <div className={cn(
                     "p-3.5 rounded-2xl transition-all shadow-xl border-2 border-white",
                     isChatOpen 
                       ? "bg-rose-600 text-white" 
                       : "bg-gradient-to-br from-rose-500 to-purple-600 text-white animate-pulse"
                   )}>
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                   </div>
                   <span className={cn("text-[10px] font-black uppercase tracking-tighter transition-colors mt-1", isChatOpen ? "text-rose-600" : "text-slate-400")}>AI</span>
                 </button>

                 <button onClick={() => setPanelMode('route')} className="flex flex-col items-center gap-1 w-20">
                   <div className={cn("p-2 rounded-xl transition-all", panelMode === 'route' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                   </div>
                   <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", panelMode === 'route' ? "text-slate-900" : "text-slate-400")}>Route</span>
                 </button>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </div>
  )
}
