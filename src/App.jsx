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
      // flattened 8x8 Bayer matrix / 32.0
      float m[32];
      m[0]=0.0;  m[1]=32.0; m[2]=8.0;  m[3]=40.0; m[4]=2.0;  m[5]=34.0; m[6]=10.0; m[7]=42.0;
      m[8]=48.0; m[9]=16.0; m[10]=56.0;m[11]=24.0;m[12]=50.0;m[13]=18.0;m[14]=58.0;m[15]=26.0;
      m[16]=12.0;m[17]=44.0;m[18]=4.0; m[19]=36.0;m[20]=14.0;m[21]=46.0;m[22]=6.0; m[23]=38.0;
      m[24]=60.0;m[25]=28.0;m[26]=52.0;m[27]=20.0;m[28]=62.0;m[29]=30.0;m[30]=54.0;m[31]=22.0;
      m[32]=3.0; m[33]=35.0;m[34]=11.0;m[35]=43.0;m[36]=1.0; m[37]=33.0;m[38]=9.0; m[39]=41.0;
      m[40]=51.0;m[41]=19.0;m[42]=59.0;m[43]=27.0;m[44]=49.0;m[45]=17.0;m[46]=57.0;m[47]=25.0;
      m[48]=15.0;m[49]=47.0;m[50]=7.0; m[51]=39.0;m[52]=13.0;m[53]=45.0;m[54]=5.0; m[55]=37.0;
      m[56]=63.0;m[57]=31.0;m[58]=55.0;m[59]=23.0;m[60]=61.0;m[61]=29.0;m[62]=53.0;m[63]=21.0;
      int idx = y * 8 + x;
      for (int k = 0; k < 64; k++) {
        if (k == idx) return m[k] / 64.0;
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
      float threshold = dither8(gl_FragCoord.xy);
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
    style={{ position: "relative", zIndex: 2, ...style }}
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
      videoUrl: "https://www.youtube.com/embed/Nj_HoMbZlr8",
    },
    {
      title: "Visuals//BMTH Live Show",
      id: "project3",
      videoUrl: "https://www.youtube.com/embed/_LTvnRwvf9c",
    },
    {
      title: "Molas full 360 LED Screens",
      id: "project4",
      videoUrl: "https://www.youtube.com/embed/1Psh961BjgY",
    },
    {
      title: "No Jardin",
      id: "project5",
      videoUrl: "https://www.youtube.com/embed/7hkOFkvYv5s",
    },
    {
      title: "CyberDolls",
      id: "project6",
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

          {/* ── Header ── */}
          <div className="flex justify-center">
            <div className="w-full border border-orange-500">
              <div className="flex flex-row items-center justify-between">
                <div className="bg-orange-500 text-black px-4 py-3 text-xl font-bold w-full h-12 flex items-center font-sans tracking-widest uppercase">
                  <GlitchText text="punk_bit" />
                </div>
                <div className="flex flex-row flex-wrap gap-0 w-full h-12">
                  {buttons.map((btn, index) => (
                    <motion.button
                      key={btn}
                      onMouseEnter={() => setHoveredButton(index)}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => {
                        if (btn === "System") scrollTo("projects");
                        else scrollTo(btn.toLowerCase());
                      }}
                      className="flex-1 px-4 py-2 bg-black h-12 w-full text-sm"
                      animate={{
                        backgroundColor: hoveredButton === index ? "#ff6600" : "#000000",
                        color: hoveredButton === index ? "#000000" : "#ff6600",
                      }}
                      transition={{ duration: 0.15 }}
                      style={{ border: "none" }}
                    >
                      {btn}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
            style={{ marginTop: "-10px" }}
          >
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
                    className="relative px-6 pt-6 pb-16 bg-black text-orange-500 flex items-start"
                    style={{
                      height: "120px",
                      border: "2px solid black",
                      width: "305px",
                      marginBottom: "20px",
                      clipPath: "polygon(0% 15%, 10% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 15%)",
                    }}
                    whileHover={{ backgroundColor: "#000", color: "#ff6600", scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    {project.title}
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-orange-500 bg-black px-4 py-8 max-w-5xl mx-auto overflow-hidden"
                    style={{ borderLeft: "2px solid #ff6600" }}
                  >
                    <HoverTitle text={project.title} />
                    <div className="py-8 text-base">
                      {project.title === "El Dorado Airport 360 LED" ? (
                        <>
                          <p className="mb-4 font-bold text-lg">Tribute to Beatriz González</p>
                          <p className="mb-8">
                            To celebrate the 90th birthday of artist Beatriz González, six animated videos were created by reinterpreting some of her most iconic works using image processing and artificial intelligence. The animations expand elements of the original paintings and apply a digital "paint" effect, blending traditional techniques with modern digital tools.
                          </p>
                          <p className="mb-8">
                            These looped animations were displayed on a large LED column at El Dorado International Airport in Bogotá, with support from the Banco de la República and Volarte.
                          </p>
                          <div className="flex justify-center gap-4 mb-4">
                            <img src="/BG_001.gif" alt="Background Animation 1" className="w-[48%] h-auto" />
                            <img src="/BG_002.gif" alt="Background Animation 2" className="w-[48%] h-auto" />
                          </div>
                        </>
                      ) : project.title === "Visuals//BMTH Live Show" ? (
                        <>
                          <p className="mb-8 font-bold text-lg">Visuals for Happy Song – BMTH Live Show</p>
                          <p className="mb-8">
                            This project involved creating live visuals for BMTH's performance of "Happy Song." The visuals were designed to amplify the energy of the performance and create a dynamic audiovisual experience.
                          </p>
                          <div className="flex justify-center gap-4 mb-4">
                            <img src="/BMTH_001.gif" alt="BMTH Animation 1" className="w-[32%] h-auto" />
                            <img src="/BMTH_002.gif" alt="BMTH Animation 2" className="w-[32%] h-auto" />
                            <img src="/BMTH_003.gif" alt="BMTH Animation 3" className="w-[32%] h-auto" />
                          </div>
                        </>
                      ) : project.title === "Molas full 360 LED Screens" ? (
                        <>
                          <p className="mb-8 font-bold text-lg">Molas full 360 LED Screens</p>
                          <p className="mb-8">
                            This project showcases the vibrant and intricate designs of Molas art on a full 360-degree LED screen. The visuals celebrate the cultural heritage of the Guna people, blending traditional patterns with modern digital techniques. It appeared at El Dorado International Airport in Bogotá and later at Ezeiza International Airport in Buenos Aires.
                          </p>
                          <div className="flex justify-center gap-4 mb-4">
                            <img src="/molas_001.gif" alt="Molas Animation" className="w-[48%] h-auto" />
                            <img src="/molas_img.png" alt="Molas Image" className="w-[48%] h-auto" />
                          </div>
                        </>
                      ) : project.title === "No Jardin" ? (
                        <>
                          <p className="mb-8 font-bold text-lg">No Jardin</p>
                          <p className="mb-8">
                            This is no longer my home — and it's no longer yours either. I'm left without margaritas, and you without roses.<br />
                            Originally conceived as a proposal for OFFF Festival Barcelona and projected at Disseny Hub Barcelona as part of the Projection Mapping showcase, this project explores "No Jardín" through visuals that challenge traditional ideas of space and nature.
                          </p>
                          <div className="flex justify-center gap-4 mb-4">
                            <img src="/jardin_001.gif" alt="No Jardin 1" className="w-[32%] h-auto" />
                            <img src="/jardin_002.gif" alt="No Jardin 2" className="w-[32%] h-auto" />
                            <img src="/jardin_003.gif" alt="No Jardin 3" className="w-[32%] h-auto" />
                          </div>
                        </>
                      ) : project.title === "CyberDolls" ? (
                        <>
                          <p className="mb-8 font-bold text-lg">CyberDolls</p>
                          <p className="mb-8">
                            Cyberdolls is a real-time visual project that merges image processing and artificial intelligence. Several anime-style figures were generated using AI, then altered through effects like dithering, displacement, and layered pixel imagery. The result is a fragmented, glitch-driven aesthetic that explores the boundaries between digital identity, synthetic beauty, and visual distortion.
                          </p>
                          <div className="flex justify-center gap-4 mb-4">
                            <img src="/CBRGRL_001.gif" alt="CyberDolls 1" className="w-[32%] h-auto" />
                            <img src="/CBRGRL_002.gif" alt="CyberDolls 2" className="w-[32%] h-auto" />
                            <img src="/CBRGRL_003.gif" alt="CyberDolls 3" className="w-[32%] h-auto" />
                          </div>
                        </>
                      ) : (
                        <p className="mb-8">Details coming soon: {project.title}</p>
                      )}

                      {project.videoUrl && (
                        <iframe
                          width="100%"
                          height="315"
                          src={`${project.videoUrl}?rel=0`}
                          title={`${project.title} video`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full mt-4"
                        />
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
            <div className="flex flex-col px-4">
              <div className="text-justify max-w-full">
                <p className="mb-[50px] text-sm">
                  {/* FIX: removed template literal that was leaking "undefined" */}
                  <TypingEffect text={"Hire visuals?\nLet's collaborate or just say hi!"} />
                </p>
                <div className="flex flex-col gap-2 mt-8 mb-6">
                  {[
                    { label: "MAIL", href: "mailto:johhannmartinez@hotmail.com" },
                    { label: "INSTAGRAM", href: "https://instagram.com/punk_bit" },
                    { label: "TIKTOK", href: "https://www.tiktok.com/@punk_bit" },
                    { label: "PATREON", href: "https://www.patreon.com/c/project2501" },
                    { label: "BEHANCE", href: "https://www.behance.net/johhannmartnez" },
                    { label: "YOUTUBE", href: "https://www.youtube.com/@ANdroIDGraphics00" },
                  ].map(({ label, href }, idx) => (
                    <motion.a
                      key={idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-4 text-sm bg-black text-orange-500 text-left"
                      style={{ minWidth: "200px", border: "1px solid #ff6600" }}
                      whileHover={{ backgroundColor: "#ff6600", color: "#000" }}
                      transition={{ duration: 0.15 }}
                    >
                      <GlitchText text={label} />
                    </motion.a>
                  ))}
                </div>
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









































































