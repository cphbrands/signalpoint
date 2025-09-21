import FAQ from "@/components/home/faq";
import Features from "@/components/home/feature";
import {Hero} from "@/components/home/hero";
import HowItWorks from "@/components/home/how-it-works";
import Industries from "@/components/home/industry";
import Pricing from "@/components/home/pricing";
import Testimonials from "@/components/home/testimonial";
import Footer from "@/components/shared/footer";
import {Navbar} from "@/components/shared/navbar";

export default function Home() {
    return (
        <main className="bg-white">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks/>
            <Industries />
            <Pricing />
            <Testimonials />
            <FAQ />
            <Footer />
        </main>
    );
}
