"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function SafeImageWrapper({ 
  src, 
  alt, 
  wrapperClassName, 
  imgClassName, 
  fallbackSrc,
  priority,
  onLoad
}: { 
  src: string; 
  alt: string; 
  wrapperClassName?: string; 
  imgClassName?: string; 
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  // Reset error state and initialize loading state when src changes
  useEffect(() => {
    setHasError(false);
    
    if (imgRef.current?.complete) {
      setIsLoading(false);
      if (onLoadRef.current) onLoadRef.current();
    } else {
      setIsLoading(true);
    }
  }, [src]);

  // Determine actual image source to display, falling back if there's an error
  const displaySrc = hasError && fallbackSrc ? fallbackSrc : (src || fallbackSrc || "");

  if (hasError && !fallbackSrc) return null;

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse z-0" />
      )}
      {displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          ref={imgRef}
          src={displaySrc} 
          alt={alt} 
          referrerPolicy="no-referrer"
          fetchPriority={priority ? "high" : "auto"}
          className={cn(imgClassName, "relative z-10 transition-opacity duration-500", isLoading ? "opacity-0" : "opacity-100")} 
          onLoad={() => {
            setIsLoading(false);
            if (onLoad) onLoad();
          }}
          onError={() => {
            if (!hasError && fallbackSrc && src !== fallbackSrc) {
              setHasError(true);
              setIsLoading(true); // reset loading state for fallback
            } else {
              setHasError(true);
              setIsLoading(false);
              if (onLoad) onLoad();
            }
          }} 
        />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
          No Image
        </div>
      )}
    </div>
  );
}
