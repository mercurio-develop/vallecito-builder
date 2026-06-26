"use client"
import { Business } from "@prisma/client";

import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, Send, Bot, User, Settings2, Check, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useChat } from '@ai-sdk/react';
import { DEFAULT_COORDS } from "@/lib/constants"
import { ItinerarySummaryCard } from "@/features/concierge/components/ItinerarySummaryCard"
import { PendingAvailability } from "@/features/concierge/components/PendingAvailability"
import { SearchResultsCard } from "@/features/concierge/components/SearchResultsCard"
import { BoletoInfoCard } from "./BoletoInfoCard"
import { TaxiFareCard } from "./TaxiFareCard"
import { useTrip } from "@/lib/store/trip-context"
import { usePreferences } from "@/lib/store/preferences-context"

export function AiConcierge() {
  const { isChatOpen, setIsChatOpen, travelVibe, travelIntensity, targetDate } = usePreferences()
  const { 
    panelMode, 
    aiPromptToTrigger, 
    setAiPromptToTrigger,
    activeItinerary,
    setActiveItinerary,
    setStartAnchorLocation,
    setPanelMode
  } = useTrip()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processedToolCalls = useRef<Set<string>>(new Set())
  const processedPromptsRef = useRef<Set<string>>(new Set())

  const sidebarOffset = "0px"

  const welcomeText = "Welcome to Vallecito. ✨ I'm your local guide to the Sacred Valley.\n\nI can help you plan a perfect day, from finding hidden gems to booking a taxi. Here's how to navigate:\n\n🔍 **Discover**: Browse local experiences using the filters above.\n\n📅 **Day View**: Your personal timeline where we organize your choices into a seamless itinerary.\n\n✨ **Personalize**: Use the settings icon ([[SETTINGS_ICON]]) in the top menu to set your travel style and intensity for better recommendations.\n\nI'm ready when you are. Tell me, what's on your mind for today's adventure?";
  const initialMessages: any[] = useMemo(() => [
    {
      id: "1",
      role: "assistant",
      content: welcomeText,
      parts: [{ type: 'text', text: welcomeText }],
    }
  ], []);

  const [input, setInput] = useState("");
  // null = tourist has not shared location; avoids sending Urubamba default as if it were real GPS
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const chat = useChat({
    api: '/api/chat',
    messages: initialMessages,
    body: {
      userLat: userCoords?.lat,
      userLng: userCoords?.lng,
      localTime: new Date().toLocaleTimeString(),
      targetDate: targetDate?.toLocaleDateString() || 'today',
      archetype: travelVibe,
      intensity: travelIntensity
    }
  } as any);

  const messages = chat.messages || [];
  const status = (chat as any).status || 'ready';
  const isLoading = status === 'submitted' || status === 'streaming';

  const sendMessage = useMemo(() => (msg: { text: string }) => {
    (chat as any).sendMessage({ text: msg.text }, {
      body: {
        userLat: userCoords?.lat,
        userLng: userCoords?.lng,
        localTime: new Date().toLocaleTimeString(),
        targetDate: targetDate?.toLocaleDateString() || 'today',
        archetype: travelVibe,
        intensity: travelIntensity,
      }
    });
  }, [chat, userCoords, travelVibe, travelIntensity, targetDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setStartAnchorLocation(latitude, longitude);
        setPanelMode('itinerary');

        // Bypass memoized sendMessage (stale closure bug) — pass fresh coords directly in body
        (chat as any).sendMessage(
          { text: `I just shared my GPS location. I am at coordinates ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. What can you recommend nearby?` },
          {
            body: {
              userLat: latitude,
              userLng: longitude,
              localTime: new Date().toLocaleTimeString(),
              targetDate: targetDate?.toLocaleDateString() || 'today',
              archetype: travelVibe,
              intensity: travelIntensity,
            }
          }
        );
      },
      () => {
        alert("Unable to retrieve your location. Please check permissions.");
      }
    );
  };

  useEffect(() => {
    if (aiPromptToTrigger) {
      setIsChatOpen(true);
      sendMessage({ text: aiPromptToTrigger });
      setAiPromptToTrigger(null);
    }
  }, [aiPromptToTrigger, sendMessage, setIsChatOpen, setAiPromptToTrigger]);

  // Sync tool results → activeItinerary + day view (v6: msg.parts, state=output-available)
  useEffect(() => {
    try {
    messages.forEach((msg: any) => {
      if (!msg || msg.role !== 'assistant' || !Array.isArray(msg.parts)) return;
      msg.parts.forEach((p: any) => {
        if (!p || p?.state !== 'output-available') return;
        if (processedToolCalls.current.has(p.toolCallId)) return;

        const toolName = p.type?.replace(/^tool-/, '');
        const output = p.output;

        // Auto-activate full itinerary from buildItinerary
        if (toolName === 'buildItinerary' && output && !output.error) {
          setActiveItinerary(output);
          setPanelMode('itinerary');
          processedToolCalls.current.add(p.toolCallId);
          return;
        }

        // mutateItinerary syncs
        if (toolName !== 'mutateItinerary' || !output?.success) return;

        const { action, targetId, resolvedBusiness, resolvedLocation, coords, time } = output;

        const minimalItinerary = () => ({
          title: "Today's Plan",
          startAnchor: {
            title: 'Current Location', locationStr: 'Current Location',
            type: 'GENERIC_TOWN' as const,
            lat: userCoords?.lat ?? DEFAULT_COORDS.lat, lng: userCoords?.lng ?? DEFAULT_COORDS.lng, time: '09:00',
          },
          endAnchor: {
            title: 'Destination', locationStr: 'Destination',
            type: 'GENERIC_TOWN' as const,
            lat: userCoords?.lat ?? DEFAULT_COORDS.lat, lng: userCoords?.lng ?? DEFAULT_COORDS.lng, time: '18:00',
          },
          waypoints: [], transitEdges: [], needsAccommodationUpsell: false, totalCost: 0,
        });

        if (action === 'SWAP_STOP' && targetId && resolvedBusiness && activeItinerary) {
          const updatedWaypoints = activeItinerary.waypoints.map((w: any) =>
            w.id === targetId ? {
              ...w,
              id: resolvedBusiness.id,
              category: resolvedBusiness.category,
              title: resolvedBusiness.name,
              locationStr: resolvedBusiness.name,
              lat: resolvedBusiness.lat,
              lng: resolvedBusiness.lng,
              service: resolvedBusiness
            } : w
          );
          setActiveItinerary({ ...activeItinerary, waypoints: updatedWaypoints });
        }

        if (action === 'SET_START') {
          const itin = activeItinerary ?? minimalItinerary();
          setActiveItinerary({
            ...itin,
            startAnchor: {
              ...itin.startAnchor,
              title: resolvedLocation,
              locationStr: resolvedLocation,
              lat: coords?.lat,
              lng: coords?.lng,
              service: resolvedBusiness,
            }
          });
          setPanelMode('itinerary');
        }

        if (action === 'SET_END') {
          const itin = activeItinerary ?? minimalItinerary();
          setActiveItinerary({
            ...itin,
            endAnchor: {
              ...itin.endAnchor,
              title: resolvedLocation,
              locationStr: resolvedLocation,
              lat: coords?.lat,
              lng: coords?.lng,
              service: resolvedBusiness,
            }
          });
          setPanelMode('itinerary');
        }

        if (action === 'UPDATE_TIME' && targetId && time && activeItinerary) {
          if (targetId === 'itin-start') {
            setActiveItinerary({ ...activeItinerary, startAnchor: { ...activeItinerary.startAnchor, time } });
          } else if (targetId === 'itin-arrival') {
            setActiveItinerary({ ...activeItinerary, endAnchor: { ...activeItinerary.endAnchor, time } });
          } else {
            const updatedWaypoints = activeItinerary.waypoints.map((w: any) =>
              w.id === targetId ? { ...w, startTime: time } : w
            );
            setActiveItinerary({ ...activeItinerary, waypoints: updatedWaypoints });
          }
        }

        processedToolCalls.current.add(p.toolCallId);
      });
    });
    } catch (e) {
      console.error("Tool sync error:", e);
    }
  }, [messages, activeItinerary, setActiveItinerary, userCoords, setPanelMode]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  useEffect(() => {
    if (!messagesEndRef.current) return;
    
    const scrollContainer = messagesEndRef.current.parentElement;
    if (!scrollContainer) return;

    let isScrolledToBottom = true;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      isScrolledToBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    const resizeObserver = new ResizeObserver(() => {
      if (isScrolledToBottom) {
        scrollToBottom("auto");
      }
    });

    resizeObserver.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, isLoading])

  useEffect(() => {
    const aiPrompt = searchParams.get("ai_prompt");
    const data = searchParams.get("data");

    if (aiPrompt && !processedPromptsRef.current.has(aiPrompt + (data || ""))) {
      processedPromptsRef.current.add(aiPrompt + (data || ""));
      setIsChatOpen(true);

      let promptText = aiPrompt;
      if (aiPrompt === "macro_trip" && data) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(data));
          promptText = `I have completed the Journey Designer. Here is my profile:\n
Dates: ${parsedData.dates?.start} to ${parsedData.dates?.end}
Travelers: ${parsedData.pax}
Exertion Profile: ${parsedData.exertionProfile}
Lenses of Discovery: ${parsedData.lenses?.join(', ')}
Autonomy Ratio: ${parsedData.autonomy}
Needs Hotels: ${parsedData.needsHotels ? 'Yes' : 'No'}\n
Please generate my macro trip plan.`;
        } catch (e) {
          console.error("Failed to parse journey designer data", e);
        }
      }

      setTimeout(() => {
        sendMessage({ text: promptText });
      }, 300);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("ai_prompt");
      params.delete("data");
      const newSearch = params.toString();
      const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, travelVibe, travelIntensity, pathname, router, targetDate, sendMessage, setIsChatOpen]);

  if (pathname !== "/explore" && !pathname?.startsWith('/pro')) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%", x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0, right: sidebarOffset }}
            exit={{ opacity: 0, y: "100%", x: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 sm:inset-auto sm:top-[56px] sm:right-0 z-[100] sm:z-40 w-full sm:w-[450px] h-full sm:h-[calc(100vh-56px)]"
          >
            <Card className="flex flex-col h-full rounded-none sm:rounded-tl-3xl shadow-2xl border-l border-gray-200 overflow-hidden bg-white/95 backdrop-blur-xl">
              <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-50 border border-rose-100 p-2 rounded-xl shadow-inner">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 tracking-wide">Vallecito Concierge</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">AI Travel Assistant</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors h-10 w-10"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide flex flex-col bg-white text-slate-900">
                {messages.map((msg: any, index: number) => {
                  const content = (msg as any).content || (msg as any).parts?.map((p: any) => p.type === 'text' ? p.text : '').join('');
                  if (msg.role === "user" && content?.startsWith("[INTERNAL]")) return null;

                  return (
                    <div key={`${msg.id}-${index}`} className="flex flex-col gap-2">
                      {content && (
                        <div 
                          className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                        >
                          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-slate-100" : "bg-rose-100"}`}>
                            {msg.role === "user" ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-rose-600" />}
                          </div>
                          <div 
                            className={`p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                              msg.role === "user" 
                                ? "bg-slate-900 text-white rounded-tr-sm" 
                                : "bg-gray-50 border border-gray-100 text-slate-800 rounded-tl-sm"
                            }`}
                          >
                            {(() => {
                              const text = content || '';
                              if (!text.includes('[[SETTINGS_ICON]]')) return text;

                              const parts = text.split('[[SETTINGS_ICON]]');
                              return (
                                <>
                                  {parts[0]}
                                  <Settings2 className="inline-block w-3.5 h-3.5 mx-0.5 mb-0.5 align-middle text-slate-500" />
                                  {parts[1]}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {/* Tool parts (AI SDK v6: msg.parts, state=output-available) */}
                      {(msg as any).parts?.map((part: any, idx: number) => {
                        if (!part || !part.type?.startsWith('tool-')) return null;
                        const key = part.toolCallId || idx;
                        const toolName = part.type.replace(/^tool-/, '');
                        const isDone = part?.state === 'output-available';
                        const output = part.output;
                        const input = part.input;

                        if (!isDone) {
                          if (toolName === 'askAvailability') {
                            return <PendingAvailability key={key} message="Contacting vendor via Ghost Phone..." />
                          }
                          if (toolName === 'askUserLocation') {
                            return (
                              <div key={key} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col gap-3 ml-11 mt-2">
                                <p className="text-sm text-rose-900 font-medium leading-relaxed">
                                  {input?.message || "Please share your location"}
                                </p>
                                <button
                                  onClick={handleShareLocation}
                                  className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                                >
                                  <Navigation className="w-4 h-4" /> Share My GPS Position
                                </button>
                              </div>
                            )
                          }
                          if (toolName === 'searchDatabase') {
                            return <PendingAvailability key={key} message="Searching Vallecito library..." />
                          }
                          return null;
                        }

                        // Render tool errors as inline cards instead of ignoring them
                        if (output?.error) {
                          return (
                            <div key={key} className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 ml-11 mt-2">
                              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                                <X className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-xs font-medium text-red-800 leading-snug">I ran into a snag — try rephrasing?</span>
                            </div>
                          );
                        }

                        if (toolName === 'askUserLocation') {
                          return (
                            <div key={key} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col gap-3 ml-11 mt-2">
                              <p className="text-sm text-rose-900 font-medium leading-relaxed">
                                {output?.message || input?.message || "Please share your location"}
                              </p>
                              <button
                                onClick={handleShareLocation}
                                className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                              >
                                <Navigation className="w-4 h-4" /> Share My GPS Position
                              </button>
                            </div>
                          )
                        }
                        if (toolName === 'buildItinerary') {
                          return <ItinerarySummaryCard key={key} itinerary={output} />
                        }
                        if (toolName === 'buildMacroTrip') {
                          return (
                            <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 w-full my-3">
                              <div className="flex items-center gap-2.5 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                                  <Navigation className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold tracking-widest text-purple-500 uppercase">Macro Trip Plan</p>
                                  <h3 className="text-sm font-semibold text-slate-900 leading-tight">{output?.title || 'Your Sacred Valley Journey'}</h3>
                                </div>
                              </div>
                              <div className="text-xs text-slate-600 font-medium ml-10">
                                {output?.days?.length || 0} Days planned
                              </div>
                            </div>
                          );
                        }
                        if (toolName === 'searchDatabase') {
                          return <SearchResultsCard key={key} businesses={output} />
                        }
                        if (toolName === 'askAvailability') {
                          return <PendingAvailability key={key} message={output?.message} />
                        }
                        if (toolName === 'showBoletoInfo') {
                          return <BoletoInfoCard key={key} data={output?.data} message={output?.message} />
                        }
                        if (toolName === 'estimateTaxiFare') {
                          return <TaxiFareCard key={key} data={output} />
                        }
                        if (toolName === 'mutateItinerary') {
                          return (
                            <div key={key} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 ml-11 mt-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Itinerary Updated</span>
                            </div>
                          )
                        }
                        return null;
                      })}
                    </div>
                  )
                })}
                {isLoading && (
                  <div className="flex flex-col gap-2 max-w-[85%] mr-auto">
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-rose-100">
                        <Bot className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="p-3 rounded-2xl text-sm bg-gray-50 border border-gray-100 text-slate-800 rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                        <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 pt-3 pb-3 flex gap-2 overflow-x-auto scrollbar-hide border-t border-gray-100 bg-white shrink-0">
                {(
                  travelVibe === 'Explorer' ? [
                    { label: "Best hikes near me", icon: "🥾", theme: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
                    { label: "Off-the-beaten-path ruins", icon: "🏺", theme: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
                    { label: "Market day schedule", icon: "🧶", theme: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
                    { label: "I need a Taxi", icon: "🚕", theme: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" }
                  ] : travelVibe === 'Foodie' ? [
                    { label: "Best local ceviche", icon: "🐟", theme: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
                    { label: "Farm-to-table dining", icon: "🌽", theme: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
                    { label: "Pisco tasting spots", icon: "🍸", theme: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
                    { label: "I need a Taxi", icon: "🚕", theme: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" }
                  ] : travelVibe === 'Luxury' ? [
                    { label: "Best spa in the valley", icon: "💆‍♀️", theme: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
                    { label: "Private transfer to Machu Picchu", icon: "🚂", theme: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
                    { label: "Fine dining with views", icon: "🥂", theme: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
                    { label: "Plan my full day", icon: "🌅", theme: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" }
                  ] : [
                    { label: "Plan my full day", icon: "🌅", theme: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
                    { label: "Find a Restaurant", icon: "🍽️", theme: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
                    { label: "I need a Taxi", icon: "🚕", theme: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
                    { label: "Book Machu Picchu", icon: "⛰️", theme: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
                    { label: "Find a Hotel", icon: "🏨", theme: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" }
                  ]
                ).map(suggestion => (
                  <button
                    key={suggestion.label}
                    onClick={() => { 
                      sendMessage({ text: suggestion.label });
                    }}
                    className={`whitespace-nowrap px-4 py-2 border text-[13px] font-bold rounded-full transition-all shadow-sm flex items-center gap-1.5 ${suggestion.theme}`}
                  >
                    <span>{suggestion.icon}</span> {suggestion.label}
                  </button>
                ))}
              </div>

              <div className="px-4 pb-6 pt-2 bg-white shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input 
                    placeholder="Describe your ideal day..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-rose-500 rounded-full h-12 px-5 shadow-inner"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="bg-slate-900 text-white hover:bg-slate-800 rounded-full shrink-0 shadow-md transition-transform hover:scale-105 h-12 w-12 flex items-center justify-center"
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
