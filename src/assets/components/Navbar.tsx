import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ElevataLogo from '../images/elevata_logo.png';

const Navigationbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const menuClose = () => setIsMenuOpen(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const isActive = (path: string) => location.pathname === path ? 'bg-black text-white' : 'text-gray-800 hover:bg-gray-100';

    return (
        <header className="bg-white border-b border-gray-200 text-black sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and brand name */}
                    <div className="flex items-center">
                        <img src={ElevataLogo} alt="FinovatrAI Logo" className="h-10 md:h-12" />
                        <h1 className="ml-3 text-xl font-bold text-black">Elevata</h1>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-1 items-center">
                        <Link 
                            to="/" 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/')}`}
                            onClick={menuClose}
                        >
                            Home
                        </Link>
                        <Link 
                            to="/inventory-management-engine" 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/inventory-management-engine')}`}
                            onClick={menuClose}
                        >
                            Inventory Management
                        </Link>
                        <Link 
                            to="/loan-suggestion-engine" 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/loan-suggestion-engine')}`}
                            onClick={menuClose}
                        >
                            Loan Suggestions
                        </Link>
                        <Link 
                            to="/business-suggestion-engine" 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/business-suggestion-engine')}`}
                            onClick={menuClose}
                        >
                            Business Suggestions
                        </Link>
                        <Link 
                            to="/technology-adoptiion-engine" 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/technology-adoptiion-engine')}`}
                            onClick={menuClose}
                        >
                            Technology Adoption
                        </Link>
                        <Link 
                            to="/register" 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/register')}`}
                            onClick={menuClose}
                        >
                            Register
                        </Link>
                    </nav>

                    {/* Mobile menu button */}
                    <button 
                        className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
                        onClick={toggleMenu}
                    >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link 
                            to="/" 
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')}`}
                            onClick={menuClose}
                        >
                            Home
                        </Link>
                        <Link 
                            to="/inventory-management-engine" 
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/inventory-management-engine')}`}
                            onClick={menuClose}
                        >
                            Inventory Management
                        </Link>
                        <Link 
                            to="/loan-suggestion-engine" 
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/loan-suggestion-engine')}`}
                            onClick={menuClose}
                        >
                            Loan Suggestions
                        </Link>
                        <Link 
                            to="/business-suggestion-engine" 
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/business-suggestion-engine')}`}
                            onClick={menuClose}
                        >
                            Business Suggestions
                        </Link>
                        <Link 
                            to="/technology-adoptiion-engine" 
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/technology-adoptiion-engine')}`}
                            onClick={menuClose}
                        >
                            Technology Adoption
                        </Link>
                        <Link 
                            to="/register" 
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/register')}`}
                            onClick={menuClose}
                        >
                            Register
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navigationbar;