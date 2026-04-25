"use client";
import { motion, AnimatePresence } from "framer-motion";
import { springPhysics } from "./GlassCard";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50,
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)"
            }}
          />
          <motion.div
            className="glass-panel"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={springPhysics}
            style={{
              position: "relative", zIndex: 51, padding: "2rem",
              width: "90%", maxWidth: "500px",
            }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
