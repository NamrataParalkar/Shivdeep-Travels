"use client";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export default function MovingBus() {
  const { scrollYProgress } = useScroll();
  // Map 0..1 scroll progress to vertical position (0% -> -10vh top, 1 -> 70vh)
  const y = useTransform(scrollYProgress, [0, 1], ["-5vh", "70vh"]);

  // Horizontal offset so bus doesn't overlap content (adjust left or right)
  return (
    <motion.div style={{ y }} className="fixed right-8 z-40 hidden md:block">
      <div className="w-20 h-20">
        <Image src="/images/bus-icon.png" alt="Bus" width={80} height={80} className="drop-shadow-2xl" />
      </div>
    </motion.div>
  );
}
