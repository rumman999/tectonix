import React, { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ShowcaseBanner = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("tx_banner_dismissed");
    if (!isDismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("tx_banner_dismissed", "true");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative w-full z-[9999] overflow-hidden bg-blue-950/45 backdrop-blur-md border-b border-blue-500/30 text-blue-200"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5 sm:mt-0">
                <Info className="h-5 w-5 animate-pulse" />
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-blue-100 font-medium">
                <span className="font-bold text-blue-400">Interactive Showcase Mode Active:</span> To ensure instant access and zero downtime for portfolio reviewers, this environment is running a fully stateful, client-side simulation. The PostgreSQL database and Node.js backend have been decoupled, and real-time seismic data is being generated locally via an intercepted mock API.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-blue-500/20 text-blue-400 hover:text-blue-200 rounded-lg transition-all duration-200 shrink-0 cursor-pointer"
              aria-label="Dismiss showcase banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
