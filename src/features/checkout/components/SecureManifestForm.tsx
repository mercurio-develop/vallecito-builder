"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Shield, Upload, FileText, Lock, ChevronRight } from "lucide-react"

interface SecureManifestFormProps {
  tripId: string
  paxCount: number
  onComplete: () => void
}

export function SecureManifestForm({ tripId, paxCount, onComplete }: SecureManifestFormProps) {
  const [step, setStep] = useState<"intro" | "details" | "documents" | "payment">("intro")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSubmitting(false)
    setStep("documents")
  }

  const handleDocumentsComplete = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSubmitting(false)
    setStep("payment")
  }

  const handlePayment = async () => {
    setIsSubmitting(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    onComplete()
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
          <Shield className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-serif font-bold mb-2">Traveler Manifest</h2>
          <p className="text-slate-400">Secure documentation for your {paxCount}-person expedition.</p>
        </div>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                  <Lock className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Bank-Grade Encryption</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Your passport details and medical information are encrypted at rest and only decrypted when purchasing your Machu Picchu and train tickets.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                  <FileText className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Required by Peruvian Law</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    The Ministry of Culture requires exact passport details to issue non-transferable entrance tickets to the sanctuary.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep("details")}
                className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-500 transition-colors flex items-center justify-center gap-2"
              >
                Begin Secure Entry <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === "details" && (
            <motion.form
              key="details"
              onSubmit={handleSubmitDetails}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Lead Traveler</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">First Name</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-rose-500 transition-colors" placeholder="As on passport" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Last Name</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-rose-500 transition-colors" placeholder="As on passport" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Passport Number</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-rose-500 transition-colors" placeholder="Required for tickets" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nationality</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-rose-500 transition-colors" placeholder="e.g., USA" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Dietary Restrictions & Medical Notes</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-rose-500 transition-colors resize-none" rows={3} placeholder="Allergies, mobility requirements, etc. (Optional)" />
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-center border-dashed cursor-pointer hover:bg-blue-100/50 transition-colors">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                    <Upload className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Upload Passport Photo Page</h4>
                    <p className="text-xs text-slate-500">Optional, but speeds up manual booking errors.</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span>Save & Continue to Documents</span>
                )}
              </button>
            </motion.form>
          )}

          {step === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Required Documents</h3>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 items-center cursor-pointer hover:border-rose-300 transition-colors">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                    <Upload className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">Passport Photo Page</h4>
                    <p className="text-xs text-slate-500">Required for Machu Picchu and train tickets.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 items-center cursor-pointer hover:border-rose-300 transition-colors">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                    <Shield className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">Travel Insurance Policy</h4>
                    <p className="text-xs text-slate-500">Required for high-altitude treks.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 items-center cursor-pointer hover:border-rose-300 transition-colors">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                    <FileText className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">Liability Waiver</h4>
                    <p className="text-xs text-slate-500">Digital signature required.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              <button
                onClick={handleDocumentsComplete}
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Encrypting...
                  </span>
                ) : (
                  <span>Secure Documents & Continue</span>
                )}
              </button>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Manifest Secured</h3>
              <p className="text-sm text-slate-500">
                Your traveler details have been encrypted and saved. The final step is to secure your bookings with a deposit.
              </p>
              
              <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="text-slate-600">Total Trip Cost</span>
                  <span className="font-bold text-slate-900">$2,450.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Deposit Due Today (30%)</span>
                  <span className="font-bold text-rose-600 text-xl">$735.00</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isSubmitting}
                className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Pay Deposit & Confirm Itinerary"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
