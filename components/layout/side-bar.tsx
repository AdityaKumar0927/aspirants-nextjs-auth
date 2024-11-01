'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, HelpCircle, BarChart2, ChevronRight, LucideIcon } from 'lucide-react'
import { cn } from "@/lib/utils"

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  subItems: string[];
}

const sidebarItems: SidebarItem[] = [
  { icon: Home, label: 'Dashboard', subItems: ['Overview', 'Analytics', 'Reports'] },
  { icon: Users, label: 'Team', subItems: ['Members', 'Permissions', 'Invites'] },
  { icon: BarChart2, label: 'Usage', subItems: ['Bandwidth', 'Serverless', 'Storage'] },
  { icon: HelpCircle, label: 'Help', subItems: ['Documentation', 'API Reference', 'Support'] },
]

export default function TypedVercelSidebar() {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [activeItem, setActiveItem] = React.useState<number | null>(null)

  return (
    <div 
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex"
      onMouseLeave={() => {
        setIsExpanded(false)
        setActiveItem(null)
      }}
    >
      <motion.div
        className="bg-white rounded-md overflow-hidden shadow-sm border border-gray-200"
        initial={false}
        animate={{ 
          width: isExpanded ? 180 : 40,
          transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
        }}
        onMouseEnter={() => setIsExpanded(true)}
      >
        <nav className="py-1">
          {sidebarItems.map((item, index) => (
            <SidebarItem
              key={item.label}
              item={item}
              isExpanded={isExpanded}
              isActive={activeItem === index}
              onMouseEnter={() => setActiveItem(index)}
            />
          ))}
        </nav>
      </motion.div>
      <AnimatePresence>
        {isExpanded && activeItem !== null && (
          <SubMenu 
            items={sidebarItems[activeItem].subItems} 
            onMouseLeave={() => setActiveItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface SidebarItemProps {
  item: SidebarItem;
  isExpanded: boolean;
  isActive: boolean;
  onMouseEnter: () => void;
}

function SidebarItem({ item, isExpanded, isActive, onMouseEnter }: SidebarItemProps) {
  return (
    <motion.div
      className={cn(
        "flex items-center px-3 py-1.5 mx-1 my-0.5 rounded cursor-pointer transition-colors",
        isExpanded ? "justify-start" : "justify-center",
        isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-black hover:bg-gray-100"
      )}
      onMouseEnter={onMouseEnter}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.3 }}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            className="ml-2 text-xs font-medium"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {isExpanded && isActive && item.subItems && (
        <ChevronRight className="w-3 h-3 ml-auto" />
      )}
    </motion.div>
  )
}

interface SubMenuProps {
  items: string[];
  onMouseLeave: () => void;
}

function SubMenu({ items, onMouseLeave }: SubMenuProps) {
  return (
    <motion.div
      className="ml-1 bg-white rounded-md overflow-hidden shadow-sm border border-gray-200"
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -5 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onMouseLeave={onMouseLeave}
    >
      <nav className="py-1 w-36">
        {items.map((subItem) => (
          <motion.div
            key={subItem}
            className="px-3 py-1 mx-1 my-0.5 text-xs cursor-pointer rounded text-gray-600 hover:text-black hover:bg-gray-100"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.3 }}
          >
            {subItem}
          </motion.div>
        ))}
      </nav>
    </motion.div>
  )
}