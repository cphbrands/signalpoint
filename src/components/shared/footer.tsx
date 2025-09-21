import React from "react";
import {MessageSquare, Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin} from "lucide-react";

const Footer = () => {
    const footerLinks = {
        product: [
            {name: "Features", href: "#"},
            {name: "Pricing", href: "#"},
            {name: "API Documentation", href: "#"},
            {name: "Integrations", href: "#"},
            {name: "Mobile Apps", href: "#"},
        ],
        company: [
            {name: "About Us", href: "#"},
            {name: "Careers", href: "#"},
            {name: "Press Kit", href: "#"},
            {name: "Partners", href: "#"},
            {name: "Contact", href: "#"},
        ],
        resources: [
            {name: "Blog", href: "#"},
            {name: "Help Center", href: "#"},
            {name: "Webinars", href: "#"},
            {name: "Case Studies", href: "#"},
            {name: "Status Page", href: "#"},
        ],
        legal: [
            {name: "Privacy Policy", href: "#"},
            {name: "Terms of Service", href: "#"},
            {name: "Cookie Policy", href: "#"},
            {name: "GDPR", href: "#"},
            {name: "Security", href: "#"},
        ],
    };

    const socialLinks = [
        {icon: Facebook, href: "#", color: "hover:text-blue-600"},
        {icon: Twitter, href: "#", color: "hover:text-blue-400"},
        {icon: Linkedin, href: "#", color: "hover:text-blue-700"},
        {icon: Instagram, href: "#", color: "hover:text-pink-600"},
    ];

    return (
        <footer id="contact" className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8">
                {/* Main Footer Content */}
                <div className="grid lg:grid-cols-6 gap-8 mb-12">
                    {/* Company Info */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-6">
                            <MessageSquare className="w-8 h-8 text-blue-400" />
                            <span className="text-2xl font-bold">BulkSMS</span>
                        </div>
                        <p className="text-gray-400 mb-6 max-w-md">
                            The world&apos;s most reliable bulk SMS platform. Send millions of messages instantly with
                            guaranteed delivery and enterprise-grade security.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center space-x-3 text-gray-400">
                                <Mail className="w-5 h-5" />
                                <span>hello@bulksmspro.com</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-400">
                                <Phone className="w-5 h-5" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-400">
                                <MapPin className="w-5 h-5" />
                                <span>San Francisco, CA</span>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex space-x-4">
                            {socialLinks.map((social, index) => {
                                const IconComponent = social.icon;
                                return (
                                    <a
                                        key={index}
                                        href={social.href}
                                        className={`text-gray-400 ${social.color} transition-colors p-2 rounded-lg hover:bg-gray-800`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-3">
                                {footerLinks.product.map((link, index) => (
                                    <li key={index}>
                                        <a
                                            href={link.href}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-3">
                                {footerLinks.company.map((link, index) => (
                                    <li key={index}>
                                        <a
                                            href={link.href}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Resources</h4>
                            <ul className="space-y-3">
                                {footerLinks.resources.map((link, index) => (
                                    <li key={index}>
                                        <a
                                            href={link.href}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-3">
                                {footerLinks.legal.map((link, index) => (
                                    <li key={index}>
                                        <a
                                            href={link.href}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>


                {/* Bottom Footer */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="text-gray-400 text-sm mb-4 md:mb-0">© 2025 BulkSMS. All rights reserved.</div>
                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>All systems operational</span>
                        </div>
                        <div>99.9% uptime last 30 days</div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
