import {ArrowRight, CheckCircle, CreditCard, MessageSquare, Send, Upload} from "lucide-react";
import Link from "next/link";

const HowItWorks = () => {
    const steps = [
        {
            icon: CreditCard,
            title: "Buy Credits",
            description: "Purchase SMS credits based on your needs. Start with any amount and top up anytime.",
            details: ["Flexible pricing", "Instant activation", "Multiple payment options", "No monthly fees"],
            color: "from-blue-500 to-cyan-500",
            bgColor: "from-blue-50 to-cyan-50",
        },
        {
            icon: Upload,
            title: "Upload Contacts",
            description: "Import your contact list easily through CSV upload or manual entry.",
            details: ["CSV file upload", "Manual contact entry", "Contact validation", "Duplicate removal"],
            color: "from-purple-500 to-pink-500",
            bgColor: "from-purple-50 to-pink-50",
        },
        {
            icon: MessageSquare,
            title: "Create Campaign",
            description: "Write your message, select recipients, and customize your campaign settings.",
            details: ["Message composer", "Contact selection", "Sender ID setup", "Message preview"],
            color: "from-green-500 to-emerald-500",
            bgColor: "from-green-50 to-emerald-50",
        },
        {
            icon: Send,
            title: "Send Messages",
            description: "Launch your campaign instantly or schedule it for later delivery.",
            details: ["Instant sending", "Schedule delivery", "Global reach", "Delivery confirmation"],
            color: "from-orange-500 to-red-500",
            bgColor: "from-orange-50 to-red-50",
        },
    ];

    return (
        <section id="how-it-works" className="py-20 ">
            <div className="max-w-screen-xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Simple Process, <span className="text-blue-600">Instant Results</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Get started in minutes with our straightforward SMS sending process
                    </p>
                </div>

                {/* Left Side - Steps */}
                <div className=" grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {steps.map((step, index) => {
                        const IconComponent = step.icon;
                        return (
                            <div
                                key={index}
                                className={`relative bg-gradient-to-r ${step.bgColor} rounded-2xl p-8 border border-white/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                            >
                                <div className="flex flex-col md:flex-row items-start gap-6">
                                    <div
                                        className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center text-white shadow-lg`}
                                    >
                                        <IconComponent className="w-8 h-8" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full">
                                                Step {index + 1}
                                            </span>
                                            <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                                        </div>
                                        <p className="text-gray-600 mb-4">{step.description}</p>

                                        <div className="grid md:grid-cols-2 gap-2">
                                            {step.details.map((detail, detailIndex) => (
                                                <div key={detailIndex} className="flex items-center space-x-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm text-gray-600">{detail}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 text-center">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
                        <h3 className="text-3xl font-bold mb-4">Ready to Send Your First Campaign?</h3>
                        <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                            Join thousands of businesses who trust our simple and reliable SMS platform
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/dashboard/create-campaign" className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                                <span>Get Started Now</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a href="#pricing" className="border border-white/30 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all">
                                View Pricing
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
