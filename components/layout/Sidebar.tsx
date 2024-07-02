import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  const icons = [
    { src: "https://cdn.builder.io/api/v1/image/assets/TEMP/7f618aee4a0f48868cf79f1cdc13fcbddfd5882dd3c76502182c302e2eed825b?", alt: "Menu icon 1", href: "/Planner" },
    { src: "https://cdn.builder.io/api/v1/image/assets/TEMP/d6ddfcf39c9f0b5b441436529edaa6f54369abf45443bddbdc05d5cae8a94705?", alt: "Menu icon 2" },
    { src: "https://cdn.builder.io/api/v1/image/assets/TEMP/95d65959906c87d0b1ee8ae5425b584ab3b9ef0f7adb87aa79d375b61fca8ff5?", alt: "Menu icon 3" },
    { src: "https://cdn.builder.io/api/v1/image/assets/TEMP/102b043dfdffc24be87c2eea3ca0a2ee0ba2ae333f3c8a86661eed0123779bab?", alt: "Menu icon 4" },
  ];

  return (
    <div className="w-24 h-screen fixed left-0 top-0 flex flex-col items-center py-8 space-y-12 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border-r border-white border-opacity-20">
      <img
        loading="lazy"
        srcSet="..."
        className="w-16 h-16 rounded-full object-cover"
        alt="User avatar"
      />
      <div className="flex flex-col space-y-12">
        {icons.map((icon, index) => (
          <Link key={index} href={icon.href || "#"} passHref>
            <img
              loading="lazy"
              src={icon.src}
              className="w-10 h-10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              alt={icon.alt}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
