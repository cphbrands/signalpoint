"use client";

import {Button} from "@/components/ui/button";
import {useUser} from "@/context/firebase-context";
import {Menu, MessageCircle, X} from "lucide-react";
import Link from "next/link";
import {useState} from "react";

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const {user} = useUser();

    const navItems = [
        {label: "Features", href: "#features"},
        {label: "Pricing", href: "#pricing"},
        {label: "How it Works", href: "#how-it-works"},
        {label: "Contact", href: "#contact"},
    ];

    return (
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-black/10 z-50">
            <nav className="max-w-screen-xl mx-auto px-4 py-4 ">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                            <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-black">BulkSMS</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="text-black hover:text-blue-600  transition-smooth"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center space-x-4 text-black">
                        {!user && (
                            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white h-9 font-medium px-5 rounded-full">
                                <Link href="/login">Sign In</Link>
                            </button>
                        )}

                        {user && user.role === "user" && (
                            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white h-9 font-medium px-5 rounded-full">
                                <Link href="/dashboard">Dashboard</Link>
                            </button>
                        )}

                        {user && user.role === "admin" && (
                            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white h-9 font-medium px-5 rounded-full">
                                <Link href="/admin">Admin</Link>
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 space-y-4">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="block text-muted-foreground hover:text-primary transition-smooth"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.label}
                            </a>
                        ))}
                        <div className="pt-4 space-y-2">
                            <Button variant="ghost" className="w-full">
                                Sign In
                            </Button>
                            <Button variant="outline" className="w-full">
                                <Link href={"/dashboard/"}>Dashboard</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};
