import React from 'react';
import { BsFacebook, BsInstagram, BsLinkedin,  BsTwitterX } from 'react-icons/bs';

const HeaderTop = () => {
  return (
    <div className="border-b border-gray-200 hidden sm:block pl-2">
      <div className="container py-4">
        <div className= "flex justify-between items-center">
          <div className="hidden lg:flex gap-1">
            <div className="header_top_icon_wrapper">
             <BsFacebook />
            </div>
            <div className="header_top_icon_wrapper">
             <BsTwitterX/>
            </div>
            <div className="header_top_icon_wrapper">
             <BsInstagram />
            </div>
            <div className="header_top_icon_wrapper">
             <BsLinkedin />
            </div>
          </div>

          <div className="text-gray-500 text-[12px]">
            <b>THE MEAL POWER</b> THE CHOICE ALWAYS IS YOURS!
          </div>

          <div className="hidden sm:flex gap-4">
            {/* <select
            className="text-gray-500 text-[12px] w-[70px]"
            name="currency"
            id="currency"
            >
              <option value="USD $">USD$</option>
              <option value="EUR €">EUR€</option>
              <option value="GH ₵">GH₵</option>
            </select> */}

            <select
            className="text-gray-500 text-[12px] w-[90px]"
            name="language"
            id="language"
            >
              <option value="English">English</option>
              <option value="French">French</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  )
}

export default HeaderTop