import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Componente para el efecto de tipeo
const TypingEffect = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    const cursorBlinkInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorBlinkInterval);
    };
  }, [text]);

  return (
    <span className="hacker-text">
      {displayedText}
      <span className={`cursor ${cursorVisible ? "visible" : "invisible"}`}>
        █
      </span>
    </span>
  );
};

const App = () => {
  const [hoveredButton, setHoveredButton] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);

  const buttons = ["Home", "About Me", "Projects", "Contact"];

  const projects = [
    null,
    {
      title: "El Dorado Airport 360 LED",
      id: "project2",
      videoUrl: "https://www.youtube.com/embed/Nj_HoMbZlr8",
    },
    {
      title: "Visuals for BMTH Happy Song Live Show",
      id: "project3",
      videoUrl: "https://www.youtube.com/embed/YOcFZgVmw0g",
    },
    {
      title: "Molas full 360 LED Screens",
      id: "project4",
      videoUrl: "https://www.youtube.com/embed/nr8RBAF7zN4",
    },
    {
      title: "No Jardin",
      id: "project5",
      videoUrl: "https://www.youtube.com/embed/U-ZVmD3W4wI",
    },
    {
      title: "CyberDolls",
      id: "project6",
      videoUrl: "https://www.youtube.com/embed/ICmpu_Ul77Y",
    },
  ];

  const wordRefs = useRef([]);

  const wrapWords = (text) => {
    return text.split(" ").map((word, index) => (
      <span
        key={index}
        className="inline-block px-1 py-0.5 mx-0.5 my-0.5 text-sm transition duration-300 hover:bg-orange-500 hover:text-black"
      >
        {word}
      </span>
    ));
  };

  const HoverTitle = ({ id, text, bg = false }) => (
    <motion.div
      id={id}
      className={`w-full ${
        bg
          ? "bg-orange-500 text-black"
          : "bg-black hover:bg-orange-500 hover:text-black"
      } py-2 mb-0 text-4xl md:text-5xl font-sans tracking-widest transition-colors duration-300 font-black`}
      style={{ transform: id === "contact" ? "translateY(-60px)" : "none" }}
    >
      <div className="max-w-5xl mx-auto px-4 font-mono uppercase h-12 flex items-center text-xl font-bold">
        {text}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-orange-500 font-mono px-0 py-0 relative">
      {/* Cabecera */}
      <div className="flex justify-center">
        <div className="w-full max-w-5xl border border-orange-500">
          <div className="flex flex-row items-center justify-between">
            <div className="bg-orange-500 text-black px-4 py-3 text-xl font-bold w-full h-12 flex items-center font-sans tracking-widest uppercase">
              Zero // Andrés Martínez
            </div>
            <div className="flex flex-row flex-wrap gap-0 w-full h-12">
              {buttons.map((btn, index) => (
                <motion.button
                  key={btn}
                  onMouseEnter={() => setHoveredButton(index)}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => {
                    const section = document.getElementById(
                      btn.toLowerCase().replace(/ /g, "-")
                    );
                    if (section) {
                      section.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`flex-1 px-4 py-2 bg-black h-12 w-full text-sm ${
                    hoveredButton === index
                      ? "bg-orange-500 text-black"
                      : "text-orange-500"
                  }`}
                  style={{ border: "none" }}
                >
                  {btn}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <HoverTitle text="ABOUT ME" id="about-me" />
        <section className="my-24">
          <div className="px-4 text-justify w-full">
            <p className="mb-10 text-sm">
              <TypingEffect text="I'm a multimedia artist based in Colombia. My work is rooted in personal experiences, concept, and graphics. I've created immersive visuals for international airports and museums using large-format LED displays. Passionate about merging code, sound, and emotion into futuristic art pieces." />
            </p>
          </div>
        </section>

        <div className="w-full">
          <img src="/blue.gif" alt="preview" className="w-full" />
        </div>

        <HoverTitle text="PROJECTS" bg={true} id="projects" />
        <section className="bg-orange-500 text-black px-0 py-10 flex flex-col justify-end relative">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 items-end relative"
            style={{ maxWidth: "90%", margin: "0 auto" }}
          >
            {projects.map((project, index) =>
              project ? (
                <button
                  key={index}
                  onClick={() => {
                    setExpandedProject(project.id); // Aseguramos que el proyecto se expanda
                    setTimeout(() => {
                      const section = document.getElementById(project.id);
                      if (section) {
                        section.scrollIntoView({ behavior: "smooth" });
                      }
                    }, 100); // Agregamos un pequeño retraso para garantizar que la sección esté visible
                  }}
                  className="relative px-6 pt-6 pb-16 bg-black text-orange-500 hover:bg-orange-500 hover:text-black transition-colors shadow-md clip-folder flex items-start"
                  style={{
                    height: "120px",
                    border: "2px solid black",
                    width: "305px",
                  }}
                >
                  {project.title}
                </button>
              ) : (
                <div key={index}></div>
              )
            )}
          </div>
        </section>

        {/* Secciones de proyectos expandidos */}
        {projects.map(
          (project) =>
            project &&
            expandedProject === project.id && (
              <section
                key={project.id}
                id={project.id}
                className="text-orange-500 bg-black px-4 py-8 max-w-5xl mx-auto"
              >
                <HoverTitle text={project.title} />
                <div className="py-4 text-sm">
                  <p className="mb-4">
                    Details and description of the project: {project.title}
                  </p>
                  <div className="flex flex-wrap justify-between gap-4 mb-4">
                    <img
                      src="/image1.png"
                      alt={`${project.title} image 1`}
                      className="w-full sm:w-[32%] h-auto"
                    />
                    <img
                      src="/image2.png"
                      alt={`${project.title} image 2`}
                      className="w-full sm:w-[32%] h-auto"
                    />
                    <img
                      src="/image3.png"
                      alt={`${project.title} image 3`}
                      className="w-full sm:w-[32%] h-auto"
                    />
                  </div>
                  {project.videoUrl && (
                    <iframe
                      width="100%"
                      height="315"
                      src={`${project.videoUrl}?rel=0&autoplay=0`}
                      title={`${project.title} video`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full"
                    />
                  )}
                </div>
              </section>
            )
        )}

        <div className="mt-24"></div>
        <HoverTitle id="contact" text="CONTACT" />
        <section id="contact" className="mt-[-10px] mb-0">
          <div className="flex flex-col px-4">
            <div className="text-justify max-w-full">
              <p className="mb-[50px] text-sm">
                <TypingEffect text="Hire visuals? Ask weird questions? Let's collaborate or just say hi!" />
              </p>
            </div>
            <div className="flex flex-row items-start justify-end gap-4">
              {/* Simulación de carpeta */}
              <div className="relative w-8 h-full">
                <div className="absolute left-0 top-0 w-1 bg-orange-500 h-full"></div>
                <div className="absolute left-0 top-[20%] w-6 h-0.5 bg-orange-500"></div>
                <div className="absolute left-0 top-[40%] w-6 h-0.5 bg-orange-500"></div>
                <div className="absolute left-0 top-[60%] w-6 h-0.5 bg-orange-500"></div>
                <div className="absolute left-0 top-[80%] w-6 h-0.5 bg-orange-500"></div>
              </div>
              {/* Botones ajustados */}
              <div className="flex flex-col gap-2">
                {[
                  {
                    label: "MAIL",
                    href: "mailto:johhannmartinez@hotmail.com",
                  },
                  {
                    label: "INSTAGRAM",
                    href: "https://instagram.com/punk_bit",
                  },
                  {
                    label: "BEHANCE",
                    href: "https://www.behance.net/johhannmartnez",
                  },
                  {
                    label: "YOUTUBE",
                    href: "https://www.youtube.com/@ANdroIDGraphics00",
                  },
                ].map(({ label, href }, idx) => (
                  <a
                    key={idx}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-4 text-sm bg-black hover:bg-orange-500 text-orange-500 hover:text-black transition-colors text-left"
                    style={{ minWidth: "200px" }}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Imagen inferior */}
      <img
        src="/bg-af.gif"
        alt="background animation"
        className="w-full mt-0 max-w-5xl mx-auto"
      />

      <style>{`
        .clip-folder {
          clip-path: polygon(0% 15%, 10% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 15%);
        }
        /* Estilos personalizados para la barra de desplazamiento */
        ::-webkit-scrollbar {
          width: 12px;
        }
        ::-webkit-scrollbar-track {
          background: black;
        }
        ::-webkit-scrollbar-thumb {
          background-color: orange;
          border: none;
        }
        ::-webkit-scrollbar-button {
          background-color: orange;
          border: none;
        }
        /* Estilo del puntero */
        body {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="orange" stroke="orange" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="black"/></svg>') 8 8, auto;
        }
        /* Estilo del texto hacker */
        .hacker-text {
          font-family: monospace;
          white-space: pre;
          display: inline-block;
        }
        .cursor {
          display: inline-block;
          width: 1ch;
          background-color: orange;
        }
        .cursor.invisible {
          background-color: transparent;
        }
      `}</style>
    </div>
  );

};

export default App;






















































































