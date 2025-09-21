import {ArrowRight, CheckCircle2, Star} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const Hero = () => {
    return (
        <section className="relative pt-32 lg:pt-0 bg-white flex items-center max-w-screen-xl mx-auto px-4 min-h-screen">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-hero opacity-10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left">
                        {/* Trust Indicator */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600  text-sm font-medium mb-6">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 " />
                            Trusted by 10,000+ businesses worldwide
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight">
                            Send Millions of
                            <br />
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600  bg-clip-text text-transparent">
                                {" "}
                                SMS Instantly
                            </span>
                        </h1>

                        <p className="text-xl text-black/60 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            Reach your customers instantly with our reliable bulk SMS platform. 99.9% delivery rate,
                            global coverage, and enterprise-grade security.
                        </p>

                        {/* Benefits */}
                        <div className="flex flex-wrap gap-4 mb-8 justify-center lg:justify-start">
                            {["No Setup Fees", "99.9% Delivery Rate", "Global Coverage"].map((benefit) => (
                                <div key={benefit} className="flex items-center gap-2 text-black/60">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link href="/dashboard/create-campaign" className="bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-2 px-6 rounded-full text-white font-semibold h-10">
                                Start Campaign
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <a href="#pricing" className=" px-6 rounded-full flex items-center justify-center text-black border h-10  border-black/10">
                                View Pricing
                            </a>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-black">10M+</div>
                                <div className="text-sm text-black/60">Messages Sent</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-black">99.9%</div>
                                <div className="text-sm text-black/60">Uptime</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-black">150+</div>
                                <div className="text-sm text-black/60">Countries</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Hero Image */}
                    <div className="relative">
                        <Image
                            src={"/images/hero.svg"}
                            alt="Bulk SMS Platform Dashboard showing message delivery analytics and global reach"
                            width={800}
                            height={800}
                            priority
                            className="w-full h-auto object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
