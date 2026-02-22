"use client"

import { useState, useEffect, ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsVisible(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.stopPropagation()
      setIsVisible(!isVisible)
    }
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsVisible(false)}
            />
          )}
          <div 
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 pointer-events-none"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl pointer-events-auto">
              {content}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-8 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}