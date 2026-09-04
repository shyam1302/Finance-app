import { Settings } from 'lucide-react';

export default function HorologyBackground() {
  const particles = Array.from({ length: 40 });
  const gears = Array.from({ length: 12 });

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none perspective-1000">
      {/* Dark mechanical gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a] opacity-80 z-10"></div>
      
      {/* Floating Gold Dust Particles */}
      {particles.map((_, i) => {
        const size = Math.random() * 4 + 1;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 10 + 10;
        const animationDelay = Math.random() * 10;
        const opacity = Math.random() * 0.5 + 0.1;
        
        return (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full bg-[#D4AF37] animate-float-up"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              opacity,
              bottom: '-10%',
              animationDuration: `${animationDuration}s`,
              animationDelay: `-${animationDelay}s`,
              boxShadow: `0 0 ${size * 2}px #D4AF37`,
            }}
          />
        );
      })}

      {/* Floating Gears */}
      {gears.map((_, i) => {
        const size = Math.random() * 40 + 20;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 20 + 20;
        const animationDelay = Math.random() * 20;
        // Some gears spin clockwise, some counter-clockwise
        const spinClass = i % 2 === 0 ? 'animate-gear-spin' : 'animate-tourbillon-tick';
        const opacity = Math.random() * 0.15 + 0.05;

        return (
          <div
            key={`gear-${i}`}
            className="absolute animate-float-up text-[#D4AF37]"
            style={{
              left: `${left}%`,
              opacity,
              bottom: '-20%',
              animationDuration: `${animationDuration}s`,
              animationDelay: `-${animationDelay}s`,
              filter: `blur(${Math.random() * 2}px)`,
            }}
          >
            <Settings 
              className={spinClass} 
              style={{ width: `${size}px`, height: `${size}px` }} 
              strokeWidth={1}
            />
          </div>
        );
      })}
    </div>
  );
}
