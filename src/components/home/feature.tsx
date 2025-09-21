import {Clock, Globe, Shield, Smartphone, Users, Zap} from "lucide-react";
import Link from "next/link";

const Features = () => {
    const features = [
        {
            icon: Smartphone,
            title: "Multi-Channel Messaging",
            description: "Send SMS, MMS, and rich media messages across multiple channels with a single API.",
            color: "from-blue-500 to-cyan-500",
        },
        {
            icon: Shield,
            title: "Enterprise Security",
            description: "Bank-grade encryption and ISO 27001 certified security for your sensitive data.",
            color: "from-green-500 to-emerald-500",
        },

        {
            icon: Zap,
            title: "Lightning Fast Delivery",
            description: "Global message delivery in seconds with 99.9% uptime guarantee.",
            color: "from-yellow-500 to-orange-500",
        },
        {
            icon: Globe,
            title: "Global Coverage",
            description: "Reach customers in 195+ countries with our extensive carrier network.",
            color: "from-indigo-500 to-purple-500",
        },
        {
            icon: Users,
            title: "Contact Management",
            description: "Organize contacts with smart segmentation and list management tools.",
            color: "from-rose-500 to-pink-500",
        },
        {
            icon: Clock,
            title: "Smart Scheduling",
            description: "Schedule messages across time zones with intelligent delivery optimization.",
            color: "from-blue-500 to-indigo-500",
        },
    ];

    return (
        <section id="features" className="py-20 ">
            <div className="max-w-screen-xl mx-auto px-4">
                <div className=" mb-16">
                    <h2 className="text-4xl tracking-wide font-bold text-gray-900 mb-4 ">
                        Powerful Features for Modern Communication
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl ">
                        Everything you need to create, send, and track successful SMS campaigns at scale
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3  gap-6">
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-black/10"
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6`}
                                >
                                    <IconComponent className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>

                {/* CTA Section */}
                <div className="mt-20 text-center">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
                        <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
                        <p className="text-xl mb-8 opacity-90">
                            Join thousands of businesses already using our platform
                        </p>
                        <Link href="/dashboard/create-campaign" className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all transform hover:scale-105">
                            Start Your Campaign
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
