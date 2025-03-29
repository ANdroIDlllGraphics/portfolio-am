import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Componente para el efecto de tipeo
const TypingEffect = ({ text, onComplete }) => { // Agrega onComplete como prop
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
        if (onComplete) onComplete(); // Llama a onComplete cuando termine
      }
    }, 50); // Velocidad aumentada

    const cursorBlinkInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorBlinkInterval);
    };
  }, [text, onComplete]);

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
  const [typingCompleted, setTypingCompleted] = useState(false);

  const buttons = ["System", "Contact"]; // Elimina "Home" y "Projects"

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
      videoUrl: "https://www.youtube.com/embed/Mh9U44Tam84",
    },
    {
      title: "CyberDolls",
      id: "project6",
      videoUrl: "https://www.youtube.com/embed/14xWbF2yR_s",
    },
  ];

  const wordRefs = useRef([]);

  const wrapWords = (text) => {
    return text.split(" ").map((word, index) => (
      <span
        key={index}
        className="inline-block px-1 py-0.5 mx-0.5 my-0.5 text-sm transition duration-300 bg-orange-500 text-black hover:bg-black hover:text-orange-500"
      >
        {word}
      </span>
    ));
  };

  const HoverTitle = ({ id, text, bg = false, style }) => (
    <motion.div
      id={id}
      className={`w-full ${
        bg
          ? "bg-orange-500 text-black"
          : "bg-black hover:bg-orange-500 hover:text-black"
      } py-2 mb-0 text-4xl md:text-5xl font-sans tracking-widest transition-colors duration-300 font-black`}
      style={{
        transform: id === "contact" ? "translateY(-60px)" : "translateY(-30px)", // Sube el recuadro responsivo
        ...style,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 font-mono uppercase h-12 flex items-center text-xl font-bold">
        {text}
      </div>
    </motion.div>
  );

  const navigateToProjects = () => {
    const section = document.getElementById("projects");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCompleteTyping = () => {
    setTypingCompleted(true);
  };

  const completeTyping = () => {
    setTypingCompleted(true);
  };

  return (
    <div className="min-h-screen bg-black text-orange-500 font-mono px-0 py-0 relative">
      {/* Contenedor principal con ancho limitado */}
      <div className="max-w-5xl mx-auto px-4">
        {/* Cabecera */}
        <div className="flex justify-center">
          <div className="w-full border border-orange-500">
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
                      if (btn === "System") {
                        navigateToProjects(); // Redirige a "Projects"
                      } else {
                        const section = document.getElementById(
                          btn.toLowerCase().replace(/ /g, "-")
                        );
                        if (section) {
                          section.scrollIntoView({ behavior: "smooth" });
                        }
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

        {/* GIF debajo del menú inicial */}
        <div className="w-full">
          <img src="/spirals.gif" alt="About Me GIF" className="w-full h-auto" />
        </div>

        {/* Sección "About Me" */}
        <HoverTitle text="ABOUT ME" id="about-me" />
        <section className="my-0">
          <div className="px-4 text-justify w-full relative">
            <p className="mb-10 text-sm">
              <TypingEffect
                text={`I'm Andrés Martínez, a multimedia artist from Bogotá, Colombia. My work blends creative coding, generative animation, and visual storytelling to build graphic languages that push the boundaries of perception. I'm drawn to art as an interface — a way to hack the everyday and open portals to new aesthetic possibilities.

I’ve been exploring formats ranging from live visuals and immersive projections to pieces developed with artificial intelligence and real-time audiovisual experimentation.

Each piece is a drift, an experiment, and a visual manifesto of my time.`}
                onComplete={handleCompleteTyping} // Llama a handleCompleteTyping al terminar
              />
            </p>
            {/* Botones dentro del cuadro de texto */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={completeTyping} // Completa el tipeo al hacer clic
                className="px-4 py-2 text-sm bg-black text-orange-500 border border-orange-500 hover:bg-orange-500 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={completeTyping} // Completa el tipeo al hacer clic
                className="px-4 py-2 text-sm bg-orange-500 text-black border border-orange-500 hover:bg-black hover:text-orange-500 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </section>

        {/* GIF debajo de "About Me" */}
        <div className="w-full" style={{ marginTop: "40px" }}>
          <img src="/blue.gif" alt="Projects GIF" className="w-full h-auto" />
        </div>

        {/* Sección "Projects" */}
        <HoverTitle
          text="PROJECTS"
          id="projects"
          bg={true}
          style={{ transform: "translateY(5px)" }}
        />
        <section className="bg-orange-500 text-black px-0 py-10 flex flex-col justify-end relative" style={{ marginTop: "-10px" }}>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 items-end relative"
            style={{ maxWidth: "100%", margin: "0 auto" }}
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
                  className="relative px-6 pt-6 pb-16 bg-black text-orange-500 hover:bg-orange-500 hover:text-black transition-colors shadow-md clip-folder flex items-start"
                  style={{
                    height: "120px",
                    border: "2px solid black",
                    width: "305px",
                    marginBottom: "20px",
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
                <div className="py-8 text-base"> {/* Cambia text-sm a text-base */}
                  {project.title === "El Dorado Airport 360 LED" ? (
                    <>
                      <p className="mb-4 font-bold text-lg">
                        Tribute to Beatriz González
                      </p>
                      <p className="mb-8">
                        To celebrate the 90th birthday of artist Beatriz González, six animated videos were created by reinterpreting some of her most iconic works using image processing and artificial intelligence. The animations expand elements of the original paintings and apply a digital “paint” effect, blending traditional techniques with modern digital tools.
                      </p>
                      <p className="mb-8">
                        These looped animations were displayed on a large LED column at El Dorado International Airport in Bogotá, with support from the Banco de la República. The project brought Beatriz González’s legacy into a contemporary context, making her work visible to thousands of travelers every day.
                      </p>
                      {/* GIFs en fila */}
                      <div className="flex justify-center gap-4 mb-4">
                        <img src="/BG_001.gif" alt="Background Animation 1" className="w-[48%] h-auto" />
                        <img src="/BG_002.gif" alt="Background Animation 2" className="w-[48%] h-auto" />
                      </div>
                    </>
                  ) : project.title === "Visuals//BMTH Live Show" ? (
                    <>
                      <p className="mb-8 font-bold text-lg">
                      Visuals for Happy Song - BMTH Live Show
                      </p>
                      <p className="mb-8">
                        This project involved creating stunning live visuals for BMTH's performance of "Happy Song." The visuals were designed to amplify the energy of the performance and immerse the audience in a dynamic audiovisual experience.
                      </p>
                      {/* GIFs en fila */}
                      <div className="flex justify-center gap-4 mb-4">
                        <img src="/BMTH_001.gif" alt="BMTH Animation 1" className="w-[32%] h-auto" />
                        <img src="/BMTH_002.gif" alt="BMTH Animation 2" className="w-[32%] h-auto" />
                        <img src="/BMTH_003.gif" alt="BMTH Animation 3" className="w-[32%] h-auto" />
                      </div>
                      </>
                      ) : project.title === "No Jardin" ? (
                      <>
                        <p className="mb-8 font-bold text-lg">No Jardin</p>
                        <p className="mb-8">
                          This is no longer my home — and it’s no longer yours either. I’m left without margaritas, and you without roses.<br />
                          This project explores the concept of “No Jardín” through a series of visuals that challenge traditional notions of space and nature. The animations bring a unique perspective to the idea of gardens in a digital context.
                        </p>
                        {/* GIFs en fila */}
                      <div className="flex justify-center gap-4 mb-4">
                        <img src="/jardin_001.gif" alt="No Jardin Animation 1" className="w-[32%] h-auto" />
                        <img src="/jardin_002.gif" alt="No Jardin Animation 2" className="w-[32%] h-auto" />
                        <img src="/jardin_003.gif" alt="No Jardin Animation 3" className="w-[32%] h-auto" />
                      </div>
                    </>
                  ) : project.title === "CyberDolls" ? (
                    <>
                      <p className="mb-8 font-bold text-lg">
                        CyberDolls
                      </p>
                      <p className="mb-8">
                      Cyberdolls is a real-time visual project that merges image processing and artificial intelligence. Several anime-style figures were generated using AI, then altered through effects like dithering, displacement, and layered pixel imagery.

The result is a fragmented, glitch-driven aesthetic that explores the boundaries between digital identity, synthetic beauty, and visual distortion.
                      </p>
                      {/* GIFs en fila */}
                      <div className="flex justify-center gap-4 mb-4">
                        <img src="/CBRGRL_001.gif" alt="CyberDolls Animation 1" className="w-[32%] h-auto" />
                        <img src="/CBRGRL_002.gif" alt="CyberDolls Animation 2" className="w-[32%] h-auto" />
                        <img src="/CBRGRL_003.gif" alt="CyberDolls Animation 3" className="w-[32%] h-auto" />
                      </div>
                    </>
                  ) : project.title === "Molas full 360 LED Screens" ? (
                    <>
                      <p className="mb-8 font-bold text-lg">
                        Molas full 360 LED Screens
                      </p>
                      <p className="mb-8">
                      This project showcases the vibrant and intricate designs of Molas art on a full 360-degree LED screen. The visuals celebrate the cultural heritage of the Guna people, blending traditional patterns with modern digital techniques.

The exhibition features large LED columns displaying animated mola designs. It first appeared at El Dorado International Airport in Bogotá, Colombia, and later at Ezeiza International Airport in Buenos Aires, Argentina. This project brings Panama’s cultural heritage to a global audience, blending tradition with digital technology in high-traffic public spaces.
 
                      </p>
                      {/* GIF y imagen */}
                      <div className="flex justify-center gap-4 mb-4">
                        <img src="/molas_001.gif" alt="Molas Animation" className="w-[48%] h-auto" />
                        <img src="/molas_img.png" alt="Molas Image" className="w-[48%] h-auto" />
                      </div>
                    </>
                  ) : (
                    <p className="mb-8">
                      Details and description of the project: {project.title}
                    </p>
                  )}
                  
                  {project.videoUrl && (
                    <iframe
                      width="100%"
                      height="315"
                      src={`${project.videoUrl}?rel=0&autoplay=1`}
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

        {/* Sección "Contact" */}
        <HoverTitle id="contact" text="CONTACT" bg={true} />
        <section id="contact" className="mt-0 mb-0"> {/* Elimina el margen superior */}
          <div className="w-full mb-16" style={{ marginTop: "-80px" }}> {/* Sube faces.gif 40px */}
            <img src="/faces.gif" alt="Contact GIF" className="w-full h-auto" />
          </div>
          <div className="flex flex-col px-4">
            <div className="text-justify max-w-full">
              <p className="mb-[50px] text-sm">
                <TypingEffect text={`Hire visuals? \nLet's collaborate or just say hi!`} />
              </p>
              {/* Botones dentro del cuadro de texto */}
              <div className="flex flex-col gap-2 mt-8 mb-6"> {/* Agrega margen inferior */}
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

      {/* GIF inferior sin margen */}
      <img
        src="/bg-af.gif"
        alt="background animation"
        className="w-full mt-0"
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
          background-color: #ff6600; /* Naranja de los títulos */
          border-radius: 6px; /* Bordes redondeados */
          border: 3px solid black; /* Añade un borde negro */
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: #e65c00; /* Naranja más oscuro al pasar el mouse */
        }
        /* Compatibilidad con navegadores que soportan scrollbar-color */
        html {
          scrollbar-width: thin; /* Scrollbar delgado */
          scrollbar-color: #ff6600 black; /* Naranja y negro */
        }
        body::-webkit-scrollbar {
          width: 32px; /* Asegura que el scrollbar se muestre */
        }
        /* Habilitar scrollbar en dispositivos móviles */
        @media (max-width: 640px) {
          ::-webkit-scrollbar {
            width: 58px; /* Scrollbar más delgado en pantallas pequeñas */
          }
        }
        /* Estilo del puntero */
        body {
        }
        /* Contenedor del texto tipeado */
        .typing-container {
          font-family: monospace;
          white-space: pre-wrap;
          display: block;
          background-color: rgb(0, 0, 0);
          color: #ff6600; /* Naranja de los títulos */
          padding: 16px;
          border: 2px solid #ff6600; /* Naranja de los títulos */
          border-radius: 0px; /* Cambia a esquinas rectas */
          max-width: 100%;
          max-height: auto; /* Ajusta el tamaño para evitar scroll */
          overflow: hidden; /* Elimina la barra de desplazamiento */
          margin: 0 auto;
          box-sizing: border-box;
        }
        @media (min-width: 640px) {
          .typing-container {
            max-width: 80%;
          }
        }
        @media (min-width: 1024px) {
          .typing-container {
            max-width: 60%;
          }
        }
        .cursor {
          display: inline-block;
          width: 1ch;
          background-color: #ff6600; /* Naranja de los títulos */
        }
        .cursor.invisible {
          background-color: transparent;
        }
      `}</style>
    </div>
  );

};

export default App;






















































































