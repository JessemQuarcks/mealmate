"use client"
import Link from 'next/link'
import React, { useState } from 'react'
import { AiOutlineHome } from 'react-icons/ai'
import { FiHeart } from 'react-icons/fi'
import { HiOutlineShoppingBag } from 'react-icons/hi'
import { IoMenuOutline } from 'react-icons/io5'

const MobNavbar = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
  
    const toggleSidebar = () => {
      setSidebarOpen(!isSidebarOpen);
    };
  
    return (
      <>
        <div className="lg:hidden fixed bottom-0 w-full bg-white left-[50%] -translate-x-[50%]
        max-w-[500px] mob_navbar px-8">
          <div className="flex justify-between text-[28px] py-2">
            <IoMenuOutline onClick={toggleSidebar} />
            <div className="relative">
              <HiOutlineShoppingBag />
              <div className="bg-red-600 rounded-full absolute top-0 right-0 w-[18px] h-[18px] text-[12px]
              text-white grid place-items-center translate-x-1 -translate-y-1">
                0
              </div>
            </div>
            <div><AiOutlineHome />
            <Link className="navbar_link relative py-2" href='/home'>
            </Link>
            </div>
            
            <div className="relative">
              <FiHeart />
              <div className="bg-red-600 rounded-full absolute top-0 right-0 w-[18px] 
              h-[18px] text-[12px] text-white grid place-items-center translate-x-1 -translate-y-1">
                0
              </div>
            </div>
          </div>
        </div>
  
        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-full bg-white w-64 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="flex justify-end p-4">
            <IoMenuOutline onClick={toggleSidebar} className="text-2xl cursor-pointer" />
          </div>
          <div className="flex flex-col items-start pl-4">
            
            <Link className="navbar_link relative py-2" href='/discover' onClick={toggleSidebar}>
              DISCOVER
            </Link>
            <Link className="navbar_link relative py-2" href='#' onClick={toggleSidebar}>
              NEARBY
            </Link>
            <Link className="navbar_link relative py-2" href='#' onClick={toggleSidebar}>
              HELP
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  export default MobNavbar