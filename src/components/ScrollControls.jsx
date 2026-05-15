import { useEffect, useState } from "react";
import { DownIcon, UpIcon } from "./SVGs";


export default function ScrollControls() {
  const [showButtons, setShowButtons] = useState(false);
  console.log("ScrollControls mounted");

  useEffect(() => {
    const container = document.querySelector(".custom-scrollbar");

    const handleScroll = () => {
      const scrollPos = container ? container.scrollTop : window.scrollY;
      setShowButtons(scrollPos > 50);
    };

    if (container) {
      container.addEventListener("scroll", handleScroll);
    } else {
      window.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const scrollTo = (position) => {
    const container = document.querySelector(".custom-scrollbar");
    const target = position === "top" ? 0 : (container ? container.scrollHeight : document.body.scrollHeight);

    if (container) {
      container.scrollTo({
        top: target,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: target,
        behavior: "smooth",
      });
    }
  };

  if (!showButtons) return null;

  return (
    <div
      className={`fixed right-4 bottom-10 flex flex-col z-50 gap-2 transition-opacity ${showButtons ? "opacity-100" : "opacity-0"
        }`}
    >
      <button
        onClick={() => scrollTo("top")}
        className=" text-white rounded-full shadow-lg hover:bg-gray-200 transition"
      >
        <img src={UpIcon} alt="Tags" width={50} height={50} />
      </button>
      <button
        onClick={() => scrollTo("bottom")}
        className=" text-white rounded-full shadow-lg hover:bg-gray-200 transition"
      >
        <img src={DownIcon} alt="Tags" width={50} height={50} />
      </button>
    </div>
  );
}
