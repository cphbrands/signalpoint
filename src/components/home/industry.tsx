import React from "react";
import {ShoppingBag, Heart, GraduationCap, Building, Truck, Utensils} from "lucide-react";
import { CONTACT_EMAIL } from "@/constants/web";

const Industries = () => {
    const industries = [
        {
            icon: ShoppingBag,
            title: "E-commerce",
            description: "Order confirmations, shipping updates, and promotional campaigns",
            features: ["Order notifications", "Abandoned cart recovery", "Flash sale alerts"],
            color: "from-blue-500 to-cyan-500",
        },
        {
            icon: Heart,
            title: "Healthcare",
            description: "Appointment reminders, test results, and health tips",
            features: ["Appointment reminders", "Prescription alerts", "Health campaigns"],
            color: "from-green-500 to-emerald-500",
        },
        {
            icon: GraduationCap,
            title: "Education",
            description: "Class schedules, exam notifications, and parent communications",
            features: ["Attendance alerts", "Exam schedules", "Event notifications"],
            color: "from-purple-500 to-pink-500",
        },
        {
            icon: Building,
            title: "Real Estate",
            description: "Property alerts, viewing appointments, and market updates",
            features: ["Property alerts", "Viewing reminders", "Market reports"],
            color: "from-orange-500 to-red-500",
        },
        {
            icon: Truck,
            title: "Logistics",
            description: "Delivery notifications, tracking updates, and driver communications",
            features: ["Delivery updates", "Route optimization", "Driver alerts"],
            color: "from-indigo-500 to-purple-500",
        },
        {
            icon: Utensils,
            title: "Hospitality",
            description: "Reservation confirmations, special offers, and guest services",
            features: ["Booking confirmations", "Special offers", "Service alerts"],
            color: "from-rose-500 to-pink-500",
        },
    ];

    return (
        <section className="py-20 ">
            <div className="max-w-screen-xl mx-auto px-4">
                <div className=" mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Perfect for Every Industry</h2>
                    <p className="text-xl text-gray-600 max-w-3xl ">
                        Discover how businesses across different sectors leverage our SMS platform
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {industries.map((industry, index) => {
                        const IconComponent = industry.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6  hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-black/10"
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${industry.color} text-white mb-6`}
                                >
                                    <IconComponent className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{industry.title}</h3>
                                <p className="text-gray-600 mb-6">{industry.description}</p>

                                <ul className="space-y-2">
                                    {industry.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-center text-sm text-gray-500">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Use Case Examples */}
                <div className="mt-20">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
                        <h3 className="text-3xl font-bold mb-6">Don&apos;t See Your Industry?</h3>
                        <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
                            Our flexible platform adapts to any business need. From startups to enterprises, we&apos;ve
                            helped companies across 50+ industries improve their communication.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        
                            <a href={`mailto:${CONTACT_EMAIL}`} className="border border-white/30 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all">
                                Contact Sales
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Industries;
