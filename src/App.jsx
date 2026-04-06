import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── WebGL Shader Background ───────────────────────────────────────────────
const ShaderBackground = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const mouseRef = useRef({ x: -9999, y: -9999 }); // off-screen default

  const vertSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;   // mouse in pixels, origin bottom-left

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // Bayer 8x8 dither — more visible pattern
float dither8(vec2 px) {
  int x = int(mod(px.x, 4.0));
  int y = int(mod(px.y, 4.0));
  float m[16];
  m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
  m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
  m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
  m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
  int idx = y * 4 + x;
  for (int k = 0; k < 16; k++) {
        if (k == idx) return m[k] / 16.0;
      }
      return 0.0;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      // flip Y so mouse coords match
      vec2 pixUV = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
      float t = u_time * 0.18;

      // Flowing noise field
      vec2 flow = vec2(
        noise(uv * 3.0 + vec2(t, t * 0.5)),
        noise(uv * 3.0 + vec2(t * 0.7, -t))
      );
      float n  = noise(uv * 5.0 + flow * 0.5 + t * 0.2);
      float n2 = noise(uv * 12.0 - flow * 0.4 + t * 0.15);

      // Scanline
      float scanline = sin(gl_FragCoord.y * 2.0) * 0.05;

      // Grid
      float gx = step(0.93, fract(uv.x * 28.0));
      float gy = step(0.93, fract(uv.y * 48.0));
      float grid = max(gx, gy) * 0.18;

      float val = n * 0.65 + n2 * 0.45 + scanline;

      // Dither
      float threshold = dither8(gl_FragCoord.xy / 2.0);
      float dithered = step(threshold, val * 1.1);  // boosted multiplier

      // Mouse proximity — fade dithering within radius
      float mouseDist = length(pixUV - u_mouse);
      float mouseRadius = 160.0;
      // smooth gradient fade: 1.0 = full dither, 0.0 = cleared by mouse
      float mouseFade = smoothstep(0.0, mouseRadius, mouseDist);
      dithered *= mouseFade;

      vec3 orange = vec3(1.0, 0.42, 0.0);
      // stronger base brightness so dither is clearly visible
      vec3 col = mix(vec3(0.0), orange * 0.55, dithered);
      col += orange * grid * mouseFade;

      // Vignette
      float vignette = 1.0 - smoothstep(0.35, 1.1, length(uv - 0.5) * 1.8);
      col *= vignette;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Track mouse
    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const render = () => {
      const t = (Date.now() - startTimeRef.current) / 1000;
      gl.uniform1f(gl.getUniformLocation(prog, "u_time"), t);
      gl.uniform2f(gl.getUniformLocation(prog, "u_resolution"), canvas.width, canvas.height);
      gl.uniform2f(gl.getUniformLocation(prog, "u_mouse"), mouseRef.current.x, mouseRef.current.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 1,
      }}
    />
  );
};

// ─── Glitch Text Effect ────────────────────────────────────────────────────
const GlitchText = ({ text, className = "", style = {} }) => {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const glitchCycle = () => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 180);
    };
    const interval = setInterval(glitchCycle, 3500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        ...style,
      }}
    >
      {text}
      {glitching && (
        <>
          <span style={{
            position: "absolute", top: 0, left: "3px",
            color: "#ff2200", opacity: 0.85, clipPath: "inset(28% 0 38% 0)",
            mixBlendMode: "screen", transform: "skewX(-2deg)",
          }}>{text}</span>
          <span style={{
            position: "absolute", top: 0, left: "-3px",
            color: "#00ffff", opacity: 0.7, clipPath: "inset(52% 0 8% 0)",
            mixBlendMode: "screen", transform: "skewX(2deg)",
          }}>{text}</span>
          <span style={{
            position: "absolute", top: "2px", left: "1px",
            color: "#ff6600", opacity: 0.4, clipPath: "inset(8% 0 78% 0)",
            mixBlendMode: "screen",
          }}>{text}</span>
        </>
      )}
    </span>
  );
};

// ─── Typing Effect ─────────────────────────────────────────────────────────
const TypingEffect = ({ text, onComplete, skip }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (skip) {
      setDisplayedText(text);
      setDone(true);
      if (onComplete) onComplete();
      return;
    }
    let index = 0;
    setDisplayedText("");
    setDone(false);
    intervalRef.current = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(intervalRef.current);
        setDone(true);
        if (onComplete) onComplete();
      }
    }, 40);
    return () => clearInterval(intervalRef.current);
  }, [text, skip]);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="typing-container">
      {displayedText.split("\n").map((line, idx) => (
        <span key={idx}>{line}<br /></span>
      ))}
      {!done && (
        <span style={{
          display: "inline-block",
          width: "1ch",
          backgroundColor: cursorVisible ? "#ff6600" : "transparent",
        }}>█</span>
      )}
    </div>
  );
};

// ─── Hover Title ───────────────────────────────────────────────────────────
const HoverTitle = ({ id, text, bg = false, style }) => (
  <motion.div
    id={id}
    className={`w-full ${bg ? "bg-orange-500 text-black" : "bg-black text-orange-500"} py-2 mb-0`}
    style={{
      position: "relative", zIndex: 2,
      boxShadow: bg
        ? "0 4px 24px rgba(255,102,0,0.25), 0 2px 8px rgba(0,0,0,0.6)"
        : "0 4px 16px rgba(0,0,0,0.7)",
      ...style,
    }}
    whileHover={!bg ? { backgroundColor: "#ff6600", color: "#000" } : {}}
    transition={{ duration: 0.2 }}
  >
    <div className="max-w-5xl mx-auto px-4 font-mono uppercase h-12 flex items-center text-xl font-bold tracking-widest">
      <GlitchText text={text} />
    </div>
  </motion.div>
);

// ─── Scanline Overlay ──────────────────────────────────────────────────────
const ScanlineOverlay = () => (
  <div style={{
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    zIndex: 1, pointerEvents: "none",
    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
  }} />
);

// ─── Ticker ────────────────────────────────────────────────────────────────
const Ticker = ({ text }) => (
  <div style={{
    overflow: "hidden", background: "#ff6600", color: "#000",
    fontFamily: "monospace", fontSize: "12px", fontWeight: "bold",
    padding: "4px 0", position: "relative", zIndex: 2,
  }}>
    <motion.div
      style={{ display: "inline-block", whiteSpace: "nowrap" }}
      animate={{ x: ["100vw", "-100%"] }}
      transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
    >
      {text} &nbsp;&nbsp;//&nbsp;&nbsp; {text} &nbsp;&nbsp;//&nbsp;&nbsp; {text}
    </motion.div>
  </div>
);

// ─── HUD Header ───────────────────────────────────────────────────────────
const HUDHeader = ({ onNav }) => {
  const [time, setTime] = useState("");
  const [signal, setSignal] = useState(87);
  const [frameCount, setFrameCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState("SYSTEM NOMINAL");
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const statusMessages = [
    "SYSTEM NOMINAL", "SIGNAL STABLE", "RENDERING ACTIVE",
    "GENERATIVE MODE ON", "SHADER LOADED", "STREAM ACTIVE",
    "NODE CONNECTED", "OUTPUT: VISUAL_FEED_01",
  ];

  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      setTime(now.toTimeString().slice(0, 8));
      setFrameCount(f => f + 1);
      setSignal(80 + Math.floor(Math.random() * 15));
    }, 1000);
    const msgCycle = setInterval(() => {
      setStatusMsg(statusMessages[Math.floor(Math.random() * statusMessages.length)]);
    }, 3000);
    return () => { clearInterval(tick); clearInterval(msgCycle); };
  }, []);

  const navItems = [
    { label: "SYSTEM", code: "01", target: "projects" },
    { label: "CONTACT", code: "02", target: "contact" },
  ];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      fontFamily: "monospace",
      zIndex: 10,
      marginBottom: "0",
    }}>
      {/* ── Top bar — system info ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#ff6600",
        color: "#000",
        padding: "2px 12px",
        fontSize: "10px",
        fontWeight: "bold",
        letterSpacing: "0.1em",
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 8px 100%)",
      }}>
        <span>SYS::PUNK_BIT_OS v2.501</span>
        <span style={{ display: "flex", gap: "16px" }}>
          <span>SIG:{signal}%</span>
          <span>FRM:{String(frameCount).padStart(4,"0")}</span>
          <span>CLK:{time}</span>
        </span>
      </div>

      {/* ── Main header ── */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        border: "1px solid #ff6600",
        borderTop: "none",
        background: "rgba(0,0,0,0.92)",
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)",
      }}>

        {/* Logo block */}
        <div style={{
          background: "#ff6600",
          color: "#000",
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: "160px",
          clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
          position: "relative",
        }}>
          <div style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "0.15em", lineHeight: 1 }}>
            <GlitchText text="PUNK_BIT" />
          </div>
          <div style={{ fontSize: "9px", opacity: 0.7, letterSpacing: "0.2em", marginTop: "2px" }}>
            MULTIMEDIA_ARTIST
          </div>
        </div>

        {/* Center — coordinates & status */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "6px 16px",
          borderLeft: "1px solid #ff6600",
          borderRight: "1px solid #ff6600",
          gap: "3px",
        }}>
          <div style={{ fontSize: "9px", color: "#ff6600", opacity: 0.6, letterSpacing: "0.15em" }}>
            LOC::4.7110°N 74.0721°W // BOGOTÁ_CO // NODE_ACTIVE
          </div>
          <div style={{ fontSize: "10px", color: "#ff6600", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              display: "inline-block", width: "6px", height: "6px",
              background: "#ff6600", borderRadius: "50%",
              boxShadow: "0 0 6px #ff6600",
              animation: "pulse 1.2s ease-in-out infinite",
            }} />
            {statusMsg}
          </div>
          {/* Mini signal bars */}
          <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "10px" }}>
            {[3,5,7,9,7,5,8,6,4,7,9,5].map((h, i) => (
              <div key={i} style={{
                width: "3px", height: `${h}px`,
                background: "#ff6600",
                opacity: 0.3 + (i % 3) * 0.2,
              }} />
            ))}
          </div>
        </div>

        {/* Nav buttons */}
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {navItems.map((item, i) => (
            <motion.button
              key={item.code}
              onMouseEnter={() => setHoveredBtn(i)}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => onNav(item.target)}
              style={{
                background: hoveredBtn === i ? "#ff6600" : "transparent",
                color: hoveredBtn === i ? "#000" : "#ff6600",
                border: "none",
                borderLeft: "1px solid #ff6600",
                padding: "0 20px",
                cursor: "crosshair",
                fontFamily: "monospace",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                minWidth: "90px",
                transition: "all 0.15s",
                clipPath: i === navItems.length - 1
                  ? "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)"
                  : "none",
              }}
            >
              <span style={{ fontSize: "9px", opacity: 0.6, letterSpacing: "0.2em" }}>[{item.code}]</span>
              <span style={{ fontSize: "11px", fontWeight: "bold", letterSpacing: "0.15em" }}>{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Bottom status bar ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "2px 12px",
        fontSize: "9px",
        color: "#ff6600",
        opacity: 0.5,
        letterSpacing: "0.1em",
        borderLeft: "1px solid #ff6600",
        borderRight: "1px solid #ff6600",
        borderBottom: "1px solid #ff6600",
        background: "rgba(0,0,0,0.6)",
      }}>
        <span>■ GLSL_SHADER::ACTIVE ■ DITHER::8x8 ■ WEBGL::ENABLED</span>
        <span>ORIGIN::BOGOTÁ ■ OUTPUT::SCREEN</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #ff6600; }
          50% { opacity: 0.3; box-shadow: none; }
        }
      `}</style>
    </div>
  );
};

// ─── Main App ──────────────────────────────────────────────────────────────
const App = () => {
  const [hoveredButton, setHoveredButton] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [typingCompleted, setTypingCompleted] = useState(false);
  const [skipTyping, setSkipTyping] = useState(false);

  const buttons = ["System", "Contact"];

  const projects = [
    null,
    {
      title: "El Dorado Airport 360 LED",
      id: "project2",
      year: "2023",
      tags: ["INSTALLATION", "LED", "GENERATIVE"],
      client: "BANCO_DE_LA_REPÚBLICA + VOLARTE",
      tool: "TOUCHDESIGNER + AI",
      type: "PUBLIC_ART",
      subtitle: "Tribute to Beatriz González — Digital Reinterpretation",
      description: "Six animated video loops created to celebrate the 90th birthday of Colombian artist Beatriz González. Each piece reinterprets her most iconic works through image processing and generative AI, applying a digital paint effect that expands the painted forms into motion.",
      description2: "The animations ran continuously on a large-format LED column at El Dorado International Airport in Bogotá, with institutional support from Banco de la República and Volarte — bringing González's visual legacy to thousands of daily travelers.",
      gifs: [
        { url: "/BG_001.gif", alt: "Beatriz González animation 1", width: "48%" },
        { url: "/BG_002.gif", alt: "Beatriz González animation 2", width: "48%" },
      ],
      videoUrl: "https://www.youtube.com/embed/Nj_HoMbZlr8",
    },
    {
      title: "Visuals//BMTH Live Show",
      id: "project3",
      year: "2024",
      tags: ["LIVE_VISUALS", "VJ", "REAL-TIME"],
      client: "BRING_ME_THE_HORIZON",
      tool: "TOUCHDESIGNER + RESOLUME",
      type: "LIVE_PERFORMANCE",
      subtitle: "Real-time Visuals — Happy Song Performance",
      description: "Real-time generative visuals designed for Bring Me The Horizon's performance of Happy Song during their live show in Bogotá. The visual system was built to respond to the energy and structure of the track, creating a dynamic audiovisual environment that amplified the performance's impact.",
      gifs: [
        { url: "/BMTH_001.gif", alt: "BMTH visual 1" },
        { url: "/BMTH_002.gif", alt: "BMTH visual 2" },
        { url: "/BMTH_003.gif", alt: "BMTH visual 3" },
      ],
      videoUrl: "https://www.youtube.com/embed/_LTvnRwvf9c",
    },
    {
      title: "Molas full 360 LED Screens",
      id: "project4",
      year: "2023",
      tags: ["INSTALLATION", "360°", "CULTURAL"],
      client: "VOLARTE",
      tool: "TOUCHDESIGNER + AFTER_EFFECTS",
      type: "PUBLIC_INSTALLATION",
      subtitle: "Cultural Heritage — Full 360° LED Display",
      description: "A large-scale digital installation celebrating the Mola textile tradition of the Guna people of Panama. Traditional geometric patterns were digitally animated and mapped onto full 360-degree LED columns, creating an immersive display that merges ancestral visual language with contemporary media technology.",
      description2: "The installation was presented at El Dorado International Airport in Bogotá and later at Ezeiza International Airport in Buenos Aires — placing indigenous cultural heritage in high-traffic international spaces.",
      gifs: [
        { url: "/molas_001.gif", alt: "Molas animation", width: "48%" },
        { url: "/molas_img.png", alt: "Molas installation", width: "48%" },
      ],
      videoUrl: "https://www.youtube.com/embed/1Psh961BjgY",
    },
    {
      title: "No Jardin",
      id: "project5",
      year: "2024",
      tags: ["PROJECTION_MAPPING", "GENERATIVE", "OFFF"],
      client: "OFFF_FESTIVAL_BARCELONA",
      tool: "TOUCHDESIGNER + GLSL",
      type: "PROJECTION_MAPPING",
      subtitle: "No Jardín — Disseny Hub Barcelona",
      description: "A generative projection mapping piece selected for the OFFF Festival Barcelona open call and projected at Disseny Hub Barcelona as part of the festival's Projection Mapping showcase. The work explores the dissolution of domestic and natural space through digital reinterpretation — gardens reconstructed from pixels and light rather than soil.",
      description2: "The animations deconstruct the idea of a garden as a fixed, organic space, replacing growth with recursion, texture with dithering, and nature with algorithmic pattern.",
      gifs: [
        { url: "/jardin_001.gif", alt: "No Jardin visual 1" },
        { url: "/jardin_002.gif", alt: "No Jardin visual 2" },
        { url: "/jardin_003.gif", alt: "No Jardin visual 3" },
      ],
      videoUrl: "https://www.youtube.com/embed/7hkOFkvYv5s",
    },
    {
      title: "CyberDolls",
      id: "project6",
      year: "2024",
      tags: ["REAL-TIME", "AI", "GLITCH"],
      client: "PERSONAL_PROJECT",
      tool: "TOUCHDESIGNER + GLSL + AI",
      type: "GENERATIVE_ART",
      subtitle: "CyberDolls — Digital Identity & Visual Distortion",
      description: "A real-time generative art project that merges AI image synthesis with post-processing systems built in TouchDesigner. Anime-style figures generated through AI are subjected to dithering, displacement mapping, and layered pixel effects — fragmenting the source image into something unstable and synthetic.",
      description2: "The result questions the boundaries between digital identity, constructed beauty, and visual corruption. Each output is unique, generated in real-time, and never fully resolved.",
      gifs: [
        { url: "/CBRGRL_001.gif", alt: "CyberDolls visual 1" },
        { url: "/CBRGRL_002.gif", alt: "CyberDolls visual 2" },
        { url: "/CBRGRL_003.gif", alt: "CyberDolls visual 3" },
      ],
      videoUrl: "https://www.youtube.com/embed/14xWbF2yR_s",
    },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSkip = () => {
    setSkipTyping(true);
    setTypingCompleted(true);
  };

  return (
    <div className="min-h-screen bg-black text-orange-500 font-mono px-0 py-0 relative">
      {/* WebGL Shader Layer */}
      <ShaderBackground />

      {/* CRT Scanlines */}
      <ScanlineOverlay />

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div className="max-w-5xl mx-auto px-4">

          {/* ── HUD Header ── */}
          <HUDHeader onNav={scrollTo} />

          {/* ── Hero GIF ── */}
          <div className="w-full">
            <img src="/spirals.gif" alt="Hero animation" className="w-full h-auto" />
          </div>

          {/* ── About Me ── */}
          <HoverTitle text="ABOUT ME" id="about-me" />
          <section className="my-0">
            <div className="px-4 text-justify w-full relative">
              <p className="mb-10 text-sm">
                <TypingEffect
                  text={`[init] user.id='Andrés Martínez' | role='multimedia_artist' | origin='Bogotá, Colombia'\n> process.start(creative_coding + generative_systems + visual_storytelling)\n> output: graphic_language.expand(perception.boundaries)\n[protocol] art_as_interface -> hack(perception) -> open(aesthetic.dimensions)`}
                  onComplete={() => setTypingCompleted(true)}
                  skip={skipTyping}
                />
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm bg-black text-orange-500 border border-orange-500 hover:bg-orange-500 hover:text-black transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => scrollTo("projects")}
                  className="px-4 py-2 text-sm bg-orange-500 text-black border border-orange-500 hover:bg-black hover:text-orange-500 transition-colors"
                >
                  Enter
                </button>
              </div>
            </div>
          </section>

          {/* ── Projects GIF ── */}
          <div className="w-full" style={{ marginTop: "40px" }}>
            <img src="/blue.gif" alt="Projects section" className="w-full h-auto" />
          </div>

          {/* ── Projects ── */}
          <HoverTitle text="PROJECTS" id="projects" bg={true} style={{ transform: "translateY(5px)" }} />
          <section
            className="bg-orange-500 text-black px-0 py-10 flex flex-col justify-end relative"
            style={{
              marginTop: "-10px",
              boxShadow: "0 8px 40px 0 rgba(255,102,0,0.18), 0 2px 8px 0 rgba(0,0,0,0.7)",
            }}
          >
            {/* HUD section header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0 24px 12px 24px", fontSize: "10px", fontFamily: "monospace",
              borderBottom: "1px solid rgba(0,0,0,0.2)", marginBottom: "8px",
            }}>
              <span>// PROJECT_INDEX :: {projects.filter(Boolean).length} ENTRIES LOADED</span>
              <span>STATUS::PORTFOLIO_ACTIVE</span>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 items-end"
              style={{ maxWidth: "100%", margin: "0 auto" }}
            >
              {projects.map((project, index) =>
                project ? (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setExpandedProject(expandedProject === project.id ? null : project.id);
                      setTimeout(() => scrollTo(project.id), 100);
                    }}
                    className="relative bg-black text-orange-500 flex flex-col items-start"
                    style={{
                      height: "130px",
                      width: "305px",
                      marginBottom: "20px",
                      border: "1px solid rgba(255,102,0,0.4)",
                      padding: "0",
                      boxShadow: "4px 6px 24px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,102,0,0.15)",
                    }}
                    whileHover={{ scale: 1.03, boxShadow: "6px 10px 32px rgba(0,0,0,0.8), 0 0 16px rgba(255,102,0,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* Card top bar */}
                    <div style={{
                      width: "100%", background: "#ff6600", color: "#000",
                      padding: "3px 14px", fontSize: "9px", fontFamily: "monospace",
                      letterSpacing: "0.15em", display: "flex", justifyContent: "space-between",
                    }}>
                      <span>PRJ::{String(index).padStart(2,"0")}</span>
                      <span>{expandedProject === project.id ? "■ OPEN" : "▶ LOAD"}</span>
                    </div>
                    {/* Card content */}
                    <div style={{ padding: "10px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
                      <span style={{ fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", lineHeight: 1.3, textAlign: "left" }}>
                        {project.title}
                      </span>
                      <div style={{ fontSize: "9px", opacity: 0.5, letterSpacing: "0.12em", display: "flex", justifyContent: "space-between" }}>
                        <span>{project.year}</span>
                        <span>{project.tags?.[0]}</span>
                      </div>
                    </div>
                  </motion.button>
                ) : (
                  <div key={index} />
                )
              )}
            </div>
          </section>

          {/* ── Expanded Projects ── */}
          <AnimatePresence>
            {projects.map(
              (project) =>
                project &&
                expandedProject === project.id && (
                  <motion.section
                    key={project.id}
                    id={project.id}
                    initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="text-orange-500 bg-black px-0 max-w-5xl mx-auto overflow-hidden"
                    style={{
                      borderLeft: "2px solid #ff6600",
                      borderRight: "2px solid #ff6600",
                      borderBottom: "2px solid #ff6600",
                      boxShadow: "0 16px 48px rgba(255,102,0,0.12), 0 4px 16px rgba(0,0,0,0.8)",
                    }}
                  >
                    {/* Project HUD header */}
                    <div style={{
                      background: "#ff6600", color: "#000",
                      padding: "4px 16px", fontFamily: "monospace", fontSize: "10px",
                      display: "flex", justifyContent: "space-between", letterSpacing: "0.15em",
                    }}>
                      <span>// LOADING :: {project.id.toUpperCase()}</span>
                      <span>{project.year} ■ {project.tags?.join(" ■ ")}</span>
                    </div>

                    <div style={{ padding: "24px 24px 32px" }}>
                      {/* Meta info row */}
                      <div style={{
                        display: "flex", gap: "24px", marginBottom: "20px",
                        fontSize: "9px", opacity: 0.5, letterSpacing: "0.15em", fontFamily: "monospace",
                        borderBottom: "1px solid rgba(255,102,0,0.2)", paddingBottom: "12px",
                      }}>
                        <span>CLIENT::{project.client}</span>
                        <span>TOOL::{project.tool}</span>
                        <span>TYPE::{project.type}</span>
                      </div>

                      <p style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "12px", fontFamily: "monospace" }}>
                        {project.subtitle}
                      </p>
                      <p style={{ marginBottom: "24px", fontSize: "14px", lineHeight: 1.7, opacity: 0.85 }}>
                        {project.description}
                      </p>
                      {project.description2 && (
                        <p style={{ marginBottom: "24px", fontSize: "14px", lineHeight: 1.7, opacity: 0.85 }}>
                          {project.description2}
                        </p>
                      )}

                      {/* GIFs */}
                      <div className="flex justify-center gap-4 mb-6">
                        {project.gifs?.map((src, i) => (
                          <img key={i} src={src.url} alt={src.alt}
                            style={{ width: src.width || "32%", height: "auto",
                              boxShadow: "4px 4px 20px rgba(0,0,0,0.7)",
                            }} />
                        ))}
                      </div>

                      {/* Video */}
                      {project.videoUrl && (
                        <div style={{ position: "relative" }}>
                          <div style={{
                            fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.15em",
                            opacity: 0.5, marginBottom: "8px",
                          }}>// VIDEO_FEED :: STREAM_ACTIVE</div>
                          <iframe
                            width="100%" height="315"
                            src={`${project.videoUrl}?rel=0`}
                            title={`${project.title} video`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.section>
                )
            )}
          </AnimatePresence>

          {/* ── Contact ── */}
          <HoverTitle id="contact" text="CONTACT" bg={true} />
          <section id="contact" className="mt-0 mb-0">
            <div className="w-full mb-16" style={{ marginTop: "-80px" }}>
              <img src="/faces.gif" alt="Contact animation" className="w-full h-auto" />
            </div>

            {/* HUD Contact Panel */}
            <div style={{
              border: "1px solid #ff6600",
              background: "rgba(0,0,0,0.92)",
              boxShadow: "4px 6px 32px rgba(255,102,0,0.12), 0 2px 12px rgba(0,0,0,0.8)",
              marginBottom: "48px",
            }}>
              {/* Panel top bar */}
              <div style={{
                background: "#ff6600", color: "#000",
                padding: "3px 16px", fontFamily: "monospace", fontSize: "10px",
                display: "flex", justifyContent: "space-between", letterSpacing: "0.15em",
              }}>
                <span>// CONTACT_MODULE :: INITIALIZED</span>
                <span>NODE::PUNK_BIT ■ STATUS::OPEN</span>
              </div>

              <div style={{ padding: "24px" }}>
                {/* Status line */}
                <div style={{
                  fontSize: "9px", color: "#ff6600", opacity: 0.5,
                  letterSpacing: "0.15em", marginBottom: "16px", fontFamily: "monospace",
                }}>
                  AVAILABILITY::FREELANCE ■ SERVICES::LIVE_VISUALS + GENERATIVE_ART + INSTALLATION
                </div>

                {/* Typing message */}
                <div style={{ marginBottom: "28px" }}>
                  <TypingEffect text={"Hire visuals?\nLet's collaborate or just say hi!"} />
                </div>

                {/* Divider */}
                <div style={{
                  borderTop: "1px solid rgba(255,102,0,0.2)",
                  marginBottom: "20px", paddingTop: "16px",
                  fontSize: "9px", color: "#ff6600", opacity: 0.4,
                  letterSpacing: "0.15em", fontFamily: "monospace",
                }}>
                  // NETWORK_LINKS :: SELECT_CHANNEL
                </div>

                {/* Links grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "8px",
                }}>
                  {[
                    { label: "MAIL", code: "01", href: "mailto:johhannmartinez@hotmail.com", desc: "DIRECT_CHANNEL" },
                    { label: "INSTAGRAM", code: "02", href: "https://instagram.com/punk_bit", desc: "@punk_bit" },
                    { label: "TIKTOK", code: "03", href: "https://www.tiktok.com/@punk_bit", desc: "@punk_bit" },
                    { label: "PATREON", code: "04", href: "https://www.patreon.com/c/project2501", desc: "project2501" },
                    { label: "BEHANCE", code: "05", href: "https://www.behance.net/johhannmartnez", desc: "PORTFOLIO" },
                    { label: "YOUTUBE", code: "06", href: "https://www.youtube.com/@ANdroIDGraphics00", desc: "ANdroIDGraphics00" },
                  ].map(({ label, code, href, desc }, idx) => (
                    <motion.a
                      key={idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", flexDirection: "column",
                        padding: "10px 14px",
                        background: "transparent",
                        border: "1px solid rgba(255,102,0,0.35)",
                        color: "#ff6600", textDecoration: "none",
                        fontFamily: "monospace",
                        boxShadow: "2px 3px 12px rgba(0,0,0,0.5)",
                        gap: "3px",
                      }}
                      whileHover={{
                        backgroundColor: "#ff6600",
                        color: "#000",
                        boxShadow: "4px 6px 20px rgba(255,102,0,0.25)",
                      }}
                      transition={{ duration: 0.15 }}
                    >
                      <div style={{ fontSize: "9px", opacity: 0.5, letterSpacing: "0.2em" }}>[{code}]</div>
                      <div style={{ fontSize: "12px", fontWeight: "bold", letterSpacing: "0.12em" }}>
                        <GlitchText text={label} />
                      </div>
                      <div style={{ fontSize: "9px", opacity: 0.5, letterSpacing: "0.1em" }}>{desc}</div>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Panel bottom bar */}
              <div style={{
                borderTop: "1px solid rgba(255,102,0,0.2)",
                padding: "4px 16px",
                fontSize: "9px", color: "#ff6600", opacity: 0.35,
                letterSpacing: "0.12em", fontFamily: "monospace",
                display: "flex", justifyContent: "space-between",
              }}>
                <span>ORIGIN::BOGOTÁ_CO ■ 4.7110°N 74.0721°W</span>
                <span>ENCRYPT::NONE ■ HANDSHAKE::OPEN</span>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom GIF */}
        <img src="/bg-af.gif" alt="background animation" className="w-full mt-0" />

        {/* Ticker footer */}
        <Ticker text="LIFE IS JUST A GAME // IN THE SHADOWS // PUNK_BIT.ART // CREATIVE CODING // GENERATIVE SYSTEMS" />
      </div>

      <style>{`
        * { box-sizing: border-box; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: black; }
        ::-webkit-scrollbar-thumb {
          background-color: #ff6600;
          border: 2px solid black;
        }
        ::-webkit-scrollbar-thumb:hover { background-color: #e65c00; }
        html { scrollbar-width: thin; scrollbar-color: #ff6600 black; }

        /* Typing container */
        .typing-container {
          font-family: monospace;
          white-space: pre-wrap;
          display: block;
          background-color: rgb(0,0,0);
          color: #ff6600;
          padding: 16px;
          border: 2px solid #ff6600;
          max-width: 100%;
          overflow: hidden;
          margin: 0 auto;
          box-shadow: 4px 6px 24px rgba(255,102,0,0.15), 0 2px 8px rgba(0,0,0,0.8);
        }
        @media (min-width: 640px) { .typing-container { max-width: 80%; } }
        @media (min-width: 1024px) { .typing-container { max-width: 60%; } }

        /* Custom cursor */
        body { cursor: crosshair; }
        a, button { cursor: crosshair; }
      `}</style>
    </div>
  );
};

export default App;




































































