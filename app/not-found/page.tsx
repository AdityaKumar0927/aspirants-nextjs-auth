'use client'

import { useState, useEffect } from 'react'

export default function Component() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-pink-50 font-sans">
      <header className={`fixed w-full transition-all duration-300 ${scrollY > 20 ? "bg-white shadow-md" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-light tracking-tight text-[#8B3A3D]">
            BUDGET GUIDE
          </div>
          <button onClick={toggleMenu} className="lg:hidden text-[#8B3A3D]">
            {isMenuOpen ? "✕" : "☰"}
          </button>
          <nav className="hidden lg:flex space-x-8">
            {["Features", "Testimonials", "Contact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[#8B3A3D] hover:text-[#7A2F32] transition-colors font-light tracking-tight">
                {item}
              </a>
            ))}
          </nav>
        </div>
        {isMenuOpen && (
          <nav className="lg:hidden bg-white px-4 py-2 shadow-md">
            <ul className="space-y-2">
              {["Features", "Testimonials", "Contact"].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="block py-2 text-[#8B3A3D] hover:text-[#7A2F32] transition-colors font-light tracking-tight" onClick={toggleMenu}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      
      <main className="max-w-6xl mx-auto px-4 pt-24 space-y-32">
        <section className="text-center space-y-8 py-20">
          <h1 className="text-5xl sm:text-6xl font-light leading-tight text-[#8B3A3D] tracking-tighter">
            Plan and build your budget
          </h1>
          
          <p className="text-xl leading-relaxed max-w-2xl mx-auto text-[#8B3A3D] font-light tracking-tight">
            A user-friendly platform where international students can review, compare, and share insights on expenses, resources, and services for navigating life abroad.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <button className="w-full py-6 text-lg bg-[#8B3A3D] hover:bg-[#7A2F32] text-white transition-colors font-light tracking-tight rounded">
              CHECK AVERAGE
            </button>
            <button className="w-full py-6 text-lg bg-[#8B3A3D] hover:bg-[#7A2F32] text-white transition-colors font-light tracking-tight rounded">
              RESOURCES
            </button>
          </div>
        </section>
        </main>
    </div>
  )
}