"use client"
import { CONTACT_EMAIL } from "@/constants/web";
import {Minus, Plus} from "lucide-react";
import {useState} from "react";

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "How quickly are messages delivered?",
            answer: "Messages are typically delivered within seconds. Our global network ensures fast delivery across 195+ countries with an average delivery time of 3-10 seconds.",
        },
        {
            question: "What is your delivery success rate?",
            answer: "We maintain a 99.2% average delivery rate globally. This varies slightly by country and carrier, but we provide detailed delivery reports for full transparency.",
        },
        {
            question: "Can I send messages internationally?",
            answer: "Yes! We support messaging to 195+ countries through our extensive carrier network. International rates vary by destination and are clearly displayed in our pricing calculator.",
        },
     
        {
            question: "Is there a minimum contract period?",
            answer: "No, all our plans are month-to-month with no long-term contracts. You can upgrade, downgrade, or cancel at any time with no penalties.",
        },
        {
            question: "What support do you provide?",
            answer: "We offer 24/7 support via email, chat, and phone. Enterprise customers get dedicated account managers and priority support with guaranteed response times.",
        },
        {
            question: "How do you handle data security?",
            answer: "We use bank-grade encryption, are ISO 27001 certified, and comply with GDPR, CCPA, and other privacy regulations. Your data is stored securely and never shared.",
        },
        {
            question: "Can I schedule messages in advance?",
            answer: "Yes, you can schedule messages for future delivery, set up recurring campaigns, and use time zone optimization to ensure messages arrive at the best times.",
        },
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Frequently Asked <span className="text-blue-600">Questions</span>
                    </h2>
                    <p className="text-xl text-gray-600">Everything you need to know about our SMS platform</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300"
                        >
                            <button
                                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                <span className="text-lg font-semibold text-gray-900 pr-8">{faq.question}</span>
                                {openIndex === index ? (
                                    <Minus className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                ) : (
                                    <Plus className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                )}
                            </button>

                            {openIndex === index && (
                                <div className="px-8 pb-6">
                                    <div className="text-gray-600 leading-relaxed">{faq.answer}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Still have questions?</h3>
                        <p className="text-gray-600 mb-6">Our support team is here to help you 24/7</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href={`mailto:${CONTACT_EMAIL}`} className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors">
                                Contact Support
                            </a>
                       
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
