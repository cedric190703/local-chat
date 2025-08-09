import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass } from "lucide-react";

interface SearchingIndicatorProps {
  isSearching?: boolean;
}

export function SearchingIndicator({ isSearching }: SearchingIndicatorProps) {
  return (
    <AnimatePresence>
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, y: "-100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-b-lg shadow-lg flex items-center justify-center gap-4 z-50"
        >
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "linear",
            }}
          >
            <Compass className="h-6 w-6" />
          </motion.div>
          <p className="text-base font-medium tracking-wide">Searching the web for answers...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}