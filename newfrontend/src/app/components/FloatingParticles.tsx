import { motion } from "motion/react";

export default function FloatingParticles() {
  const particles = Array.from({ length: 25 });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1 + "px",
            height: Math.random() * 3 + 1 + "px",
            background: i % 3 === 0
              ? "rgba(124,58,237,0.7)"
              : i % 3 === 1
              ? "rgba(59,130,246,0.6)"
              : "rgba(167,139,250,0.5)",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
          }}
          animate={{
            y: [0, -(Math.random() * 200 + 100)],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 12 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 8,
          }}
        />
      ))}
    </div>
  );
}
