import { useState } from "react";
import { motion } from "framer-motion";

const App = () => {
  const [hoveredButton, setHoveredButton] = useState(null);

  const buttons = ["Home", "About Me", "Projects", "Contact"];

  const projects = [
    null,
    { title: "Proyecto 2", link: "/project2" },
    { title: "Proyecto 3", link: "/project3" },
    { title: "Proyecto 4", link: "/project4" },
    { title: "Proyecto 5", link: "/project5" },
    { title: "Proyecto 6", link: "/project6" },
  ];

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

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const HoverTitle = ({ id, text, bg = false }) => (
    <motion.div
      id={id}
      className={`w-full ${bg ? "bg-orange-500 text-black" : "bg-black hover:bg-orange-500 hover:text-black"} py-4 mb-0 text-4xl md:text-5xl font-sans tracking-widest transition-colors duration-300 font-black`}
    >
      <div className="max-w-5xl mx-auto px-4 font-mono uppercase">{text}</div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-orange-500 font-mono px-0 py-0 relative">
      <div className="flex justify-center">
        <div className="w-full max-w-5xl border border-orange-500">
          <div className="flex flex-row items-center justify-between">
            <div className="bg-orange-500 text-black px-4 py-2 text-xl font-bold">
              Zero // Andrés Martínez
            </div>
            <div className="flex flex-row flex-wrap gap-0">
              {buttons.map((btn, index) => (
                <motion.button
                  key={btn}
                  onClick={() => scrollToSection(btn.toLowerCase().replace(/ /g, "-"))}
                  onMouseEnter={() => setHoveredButton(index)}
                  onMouseLeave={() => setHoveredButton(null)}
                  className={`px-4 py-2 bg-black ${
                    hoveredButton === index ? "bg-orange-500 text-black" : "text-orange-500"
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

      <div className="max-w-5xl mx-auto px-0 py-12">
        <HoverTitle text="ABOUT ME" />
        <section id="about-me" className="my-24 relative">
          <img src="/blue.gif" alt="preview" className="w-full absolute top-0 left-0" />
          <div className="px-4 relative z-10">
            <p className="max-w-xl mb-10 text-sm">
              {wrapWords("I’m a visual and multimedia artist based in Colombia. My work is rooted in personal experiences, values, and sound. I’ve created immersive visuals for international airports and museums using large-format LED displays. Passionate about merging code, sound, and emotion into futuristic art pieces.")}
            </p>
          </div>
        </section>

        <HoverTitle text="PROJECTS" bg={true} />
        <section id="projects" className="mt-0 bg-orange-500 text-black px-0 py-12 flex flex-col justify-end relative" style={{ height: "528px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 p-8 items-end relative" style={{ marginTop: "0px" }}>
            {projects.map((project, index) => (
              project ? (
                <a
                  key={index}
                  href={project.link}
                  className="relative px-6 pt-6 pb-20 bg-black text-orange-500 hover:bg-orange-500 hover:text-black transition-colors shadow-md clip-folder flex items-start"
                  style={{ height: "200px" }}
                >
                  {project.title}
                </a>
              ) : (
                <div key={index}></div>
              )
            ))}
          </div>
        </section>

        <div className="mt-24"></div>
        <HoverTitle text="CONTACT" />
        <section id="contact" className="my-24">
          <div className="px-4 text-sm">
            <p className="mb-6">
              {wrapWords("Let’s collaborate or just say hi!")}
            </p>
            <ul className="space-y-4">
              <li>
                <a href="mailto:johhannmartinez@hotmail.com" className="hover:underline">
                  johhannmartinez@hotmail.com
                </a>
              </li>
              <li>
                <a href="https://instagram.com/punkbit" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  @punkbit
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <img src="/bg-af.gif" alt="background animation" className="w-full mt-12" />

      <style>{`
        .clip-folder {
          clip-path: polygon(0% 15%, 10% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
      `}</style>
    </div>
  );
};

export default App;

