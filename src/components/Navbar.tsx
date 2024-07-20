import Link from 'next/link'
import React from 'react'


const Navbar = () => {
  
  return (
    <div className="hidden lg:block">
        <div className="container">
            <div className="flex w-fit gap-10 mx-auto font-medium py-4 text-blackish">
                <Link className="navbar_link relative" href='http://localhost:3000'>
                HOME
                </Link>
                <Link className="navbar_link relative" href='/discover'>
                DISCOVER
                </Link>
                <Link className="navbar_link relative" href='#'>
                NEARBY
                </Link>
                {/* <Link className="navbar_link relative" href='#'>
                BREAKFAST
                </Link>
                <Link className="navbar_link relative" href='#'>
                LUNCH
                </Link>
                <Link className="navbar_link relative" href='#'>
                HISTORY
                </Link> */}
                <Link className="navbar_link relative" href='#'>
                HELP
                </Link>
            </div>
        </div>
    </div>
  )
}

export default Navbar