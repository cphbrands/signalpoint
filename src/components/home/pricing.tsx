import React from "react";
import {Check, Star, ArrowRight} from "lucide-react";
import Link from "next/link";

const packages = [
    {
        id: "starter",
        name: "Starter",
        credits: 2000,
        price: 2000 * 0.12,
        popular: false,
        description: "Perfect for small teams starting out with SMS campaigns.",
        extraFeatures: ["Basic analytics", "Contact management", "Email support"],
    },
    {
        id: "business",
        name: "Business",
        credits: 5000,
        price: 5000 * 0.12,
        popular: true,
        description: "Ideal for growing businesses with higher volume needs.",
        extraFeatures: ["Advanced analytics", "Priority support", "Custom sender ID"],
    },
    {
        id: "enterprise",
        name: "Enterprise",
        credits: 10000,
        price: 10000 * 0.12,
        popular: false,
        description: "Tailored solutions for large organizations with unlimited campaigns.",
        extraFeatures: ["Dedicated account manager", "White-label options", "SLA guarantees"],
    },
];

const staticFeatures = ["99% Delivery Rate", "Access to API"];

const Pricing = () => {
    return (
        <section id="pricing" className="py-20 bg-white">
            <div className="max-w-screen-xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Simple, Transparent <span className="text-blue-600">Pricing</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Choose the perfect package for your business. Pay only for the credits you need.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {packages.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`relative rounded-3xl p-8 ${
                                pkg.popular
                                    ? "bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 transform scale-105"
                                    : "bg-white border-2 border-gray-200"
                            } hover:shadow-xl transition-all duration-300`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                                        <Star className="w-4 h-4" />
                                        <span>Most Popular</span>
                                    </div>
                                </div>
                            )}

                            {/* Package Title */}
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                                <p className="text-gray-600 mb-4">{pkg.description}</p>
                                <p className="text-gray-900 font-semibold mb-4">
                                    {pkg.credits.toLocaleString()} Credits
                                </p>
                                <div className="flex items-center justify-center">
                                    <span className="text-5xl font-bold text-gray-900">${pkg.price.toFixed(0)}</span>
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {staticFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                                {pkg.extraFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Buy Button */}
                            <Link href="/dashboard/buy-credits"
                                className={`w-full py-4 px-6 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2 ${
                                    pkg.popular
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                }`}
                            >
                                <span>Buy Now</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
