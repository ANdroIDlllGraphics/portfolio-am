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
    }, 50);

    const cursorBlinkInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorBlinkInterval);
    };
  }, [text]);

  return (
    <div className="typing-container">
      {displayedText.split("\n").map((line, idx) => (
        <span key={idx}>
          {line}
          <br />
        </span>
      ))}
      {displayedText.length < text.length && (
        <span className={`cursor ${cursorVisible ? "visible" : "invisible"}`}>
          █
        </span>
      )}
    </div>
  );
};

const App = () => {
  const [hoveredButton, setHoveredButton] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);

  const buttons = ["System", "Contact"];

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

  const HoverTitle = ({ id, text, bg = false }) => (
    <motion.div
      id={id}
      className={`w-full ${
        bg
          ? "bg-orange-500 text-black"
          : "bg-black hover:bg-orange-500 hover:text-black"
      } py-2 mb-0 text-4xl md:text-5xl font-sans tracking-widest transition-colors duration-300 font-black`}
      style={{
        transform: id === "contact" ? "translateY(-60px)" : "translateY(-30px)",
      }}
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
              punk_bit
            </div>
            <div className="flex flex-row flex-wrap gap-0 w-full h-12">
              {buttons.map((btn, index) => (
                <motion.button
                  key={btn}
                  onMouseEnter={() => setHoveredButton(index)}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => {
                    const sectionId = btn === "System" ? "projects" : btn.toLowerCase().replace(/ /g, "-");
                    const section = document.getElementById(sectionId);
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

      {/* GIF encima de "About Me" */}
      <div className="w-full max-w-5xl mx-auto">
        <img src="/faces.gif" alt="About Me GIF" className="w-full h-auto" />
      </div>

      <HoverTitle text="ABOUT ME" id="about-me" />
      <section className="my-24">
        <div
          className="px-4 text-justify w-full border border-orange-500 p-4 max-w-5xl mx-auto"
          style={{ marginTop: "-110px", marginBottom: "0px" }} // Sube el cuadro de texto 110px
        >
          <p className="mb-10 text-sm">
            <TypingEffect text={`I'm a multimedia artist based in Colombia. My work is rooted in personal experiences, concept, and graphics.\nI've created immersive visuals for international airports and museums using large-format LED displays.\nPassionate about merging code, sound, and emotion into futuristic art pieces.`} />
          </p>
          {/* Botones debajo del cuadro de texto */}
          <div className="flex gap-4 mt-4">
            <button className="px-4 py-2 text-sm bg-black text-orange-500 border border-orange-500 hover:bg-orange-500 hover:text-black transition-colors">
              Cancel
            </button>
            <button className="px-4 py-2 text-sm bg-orange-500 text-black border border-orange-500 hover:bg-black hover:text-orange-500 transition-colors">
              Accept
            </button>
          </div>
        </div>
      </section>

      {/* GIF encima de "Projects" */}
      <div className="w-full max-w-5xl mx-auto" style={{ marginTop: "0px" }}> {/* Margen superior ajustado a 0px */}
        <img src="/blue.gif" alt="Projects GIF" className="w-full h-auto" />
      </div>

      <HoverTitle text="PROJECTS" bg={true} id="projects" />
      <section
        className="bg-orange-500 text-black px-0 py-10 flex flex-col justify-end relative"
        style={{ marginTop: "0px" }} // Ajusta el margen superior a 0px
      >
        <div
          className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 items-end relative"
        >
          {projects.map((project, index) =>
            project ? (
              <button
                key={index}
                onClick={() => {
                  setExpandedProject(project.id);
                  setTimeout(() => {
                    const section = document.getElementById(project.id);
                    if (section) {
                      section.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 100);
                }}
                className="relative px-6 pt-6 pb-16 bg-black text-orange-500 hover:bg-orange-500 hover:text-black transition-colors shadow-md flex items-start"
                style={{
                  height: "120px",
                  border: "2px solid black",
                  width: "305px",
                  clipPath:
                    "polygon(0% 15%, 10% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 15%)", // Bisel recto
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
              style={{ marginTop: "-50px" }} // Sube la sección 50px
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

      {/* GIF encima de "Contact" */}
      <div className="w-full max-w-5xl mx-auto">
        <img src="/spirals.gif" alt="Contact GIF" className="w-full h-auto" />
      </div>

      <HoverTitle id="contact" text="CONTACT" />
      <section id="contact" className="mt-[-50px] mb-0"> {/* Mueve el párrafo 40px más arriba */}
        <div className="flex flex-col px-4 max-w-5xl mx-auto">
          <div
            className="text-justify w-full border border-orange-500 p-4"
            style={{ width: "90%", marginBottom: "20px" }} // Agrega un margen inferior de 20px
          >
            <p className="mb-[50px] text-sm">
              <TypingEffect text={`Hire visuals? \nLet's collaborate or just say hi!`} />
            </p>
            {/* Botones debajo del texto */}
            <div className="flex flex-col gap-2 mt-4">
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

      {/* Imagen inferior */}
      <div className="w-full max-w-5xl mx-auto">
        <img
          src="/bg-af.gif"
          alt="background animation"
          className="w-full h-auto"
        />
      </div>
    </div>
  );
};

export default App;

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
    background-color: #ff6600; /* Naranja de los títulos */
    border: none;
  }
  ::-webkit-scrollbar-button {
    background-color: #ff6600; /* Naranja de los títulos */
    border: none;
  }
  /* Habilitar scrollbar en dispositivos móviles */
  html {
    scrollbar-width: thin;
    scrollbar-color: #ff6600 black;
  }
  body::-webkit-scrollbar {
    display: block;
  }
`}</style>






















































































