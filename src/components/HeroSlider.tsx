"use client";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay, Pagination } from "swiper/modules";
import { motion } from "framer-motion";
import "./swiper-fix.css"; // ✅ import the override

const slides = [
  { img: "/images/slide1.jpg", title: "Safe & Reliable School Bus Service", subtitle: "Track your child in real time." },
  { img: "/images/slide2.jpg", title: "Timely Pickup & Drop", subtitle: "Punctual routes and live alerts." },
  { img: "/images/slide3.jpg", title: "Secure & Comfortable", subtitle: "Experienced drivers and safety-first approach." },
];

export default function HeroSlider() {
  return (
    <section className="mt-4">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        loop
        pagination={{ clickable: true }}
        className="h-[360px] md:h-[420px]"
      >
        {slides.map((s, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={s.img}
                alt={s.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 1200px"
              />

              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/30"></div>

              {/* ✅ Transparent text container */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute left-8 md:left-16 bottom-10 md:bottom-20 
                           bg-black/40 backdrop-blur-sm rounded-xl p-6 max-w-xl text-white"
              >
                <h2 className="text-2xl md:text-4xl font-extrabold drop-shadow-md">{s.title}</h2>
                <p className="mt-2 text-sm md:text-base drop-shadow-md">{s.subtitle}</p>
                <div className="mt-4 flex gap-3">
                  <a href="#track" className="px-4 py-2 rounded-lg bg-white text-purple-700 font-semibold">
                    Track Now
                  </a>
                  <a href="#contact" className="px-4 py-2 rounded-lg bg-white/50 text-white">
                    Contact Us
                  </a>
                </div>
              </motion.div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
