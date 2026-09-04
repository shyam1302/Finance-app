import { Settings } from 'lucide-react';

const STATIC_PARTICLES = Array.from({ length: 40 }, (_, i) => {
  const pseudoRand = (seed) => {
    const x = Math.sin(seed + i * 13.37) * 10000;
    return x - Math.floor(x);
  };

  const size = pseudoRand(1) * 4 + 1;
  const left = pseudoRand(2) * 100;
  const animationDuration = pseudoRand(3) * 10 + 10;
  const animationDelay = pseudoRand(4) * 10;
  const opacity = pseudoRand(5) * 0.5 + 0.1;

  return {
    id: `particle-${i}`,
    size,
    left,
    animationDuration,
    animationDelay,
    opacity,
  };
});

const STATIC_GEARS = Array.from({ length: 12 }, (_, i) => {
  const pseudoRand = (seed) => {
    const x = Math.sin(seed + i * 19.83) * 10000;
    return x - Math.floor(x);
  };

  const size = pseudoRand(10) * 40 + 20;
  const left = pseudoRand(11) * 100;
  const animationDuration = pseudoRand(12) * 20 + 20;
  const animationDelay = pseudoRand(13) * 20;
  const opacity = pseudoRand(14) * 0.15 + 0.05;
  const blur = pseudoRand(15) * 2;
  const spinClass = i % 2 === 0 ? 'animate-gear-spin' : 'animate-tourbillon-tick';

  return {
    id: `gear-${i}`,
    size,
    left,
    animationDuration,
    animationDelay,
    opacity,
    blur,
    spinClass,
  };
});

export default function HorologyBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none perspective-1000">
      {/* Dark mechanical gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a] opacity-80 z-10"></div>
      
      {/* Floating Gold Dust Particles */}
      {STATIC_PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#D4AF37] animate-float-up"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            opacity: p.opacity,
            bottom: '-10%',
            animationDuration: `${p.animationDuration}s`,
            animationDelay: `-${p.animationDelay}s`,
            boxShadow: `0 0 ${p.size * 2}px #D4AF37`,
          }}
        />
      ))}

      {/* Floating Gears */}
      {STATIC_GEARS.map((g) => (
        <div
          key={g.id}
          className="absolute animate-float-up text-[#D4AF37]"
          style={{
            left: `${g.left}%`,
            opacity: g.opacity,
            bottom: '-20%',
            animationDuration: `${g.animationDuration}s`,
            animationDelay: `-${g.animationDelay}s`,
            filter: `blur(${g.blur}px)`,
          }}
        >
          <Settings 
            className={g.spinClass} 
            style={{ width: `${g.size}px`, height: `${g.size}px` }} 
            strokeWidth={1}
          />
        </div>
      ))}
    </div>
  );
}
