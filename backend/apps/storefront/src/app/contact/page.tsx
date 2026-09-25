import React from "react";

export default function ContactPage() {
  return (
    <div className="bg-cream text-charcoal min-h-screen">
      
      {/* HEADER BANNER */}
      <div className="relative bg-[#070707] text-white py-24 sm:py-32 overflow-hidden border-b border-gold/30">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="/image/luxury/hero.jpg"
            alt="Contact Tirupati Jewellers"
            className="w-full h-full object-cover object-center grayscale"
          />
          <div className="absolute inset-0 bg-[#070707]/80" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-display text-4xl sm:text-6xl text-white mb-6">
            Contact Us
          </h1>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold-light font-bold">
            We are here to assist you
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* CONTACT FORM PLACEHOLDER */}
          <div className="bg-white p-8 sm:p-12 border border-cream-dark shadow-sm">
            <h2 className="font-display text-3xl text-charcoal mb-8">Send an Inquiry</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-[10px] uppercase tracking-widest text-charcoal-light mb-2">First Name</label>
                  <input type="text" className="w-full border-b border-cream-dark py-3 focus:outline-none focus:border-gold transition-colors bg-transparent font-serif" placeholder="Your first name" />
                </div>
                <div>
                  <label className="block font-sans text-[10px] uppercase tracking-widest text-charcoal-light mb-2">Last Name</label>
                  <input type="text" className="w-full border-b border-cream-dark py-3 focus:outline-none focus:border-gold transition-colors bg-transparent font-serif" placeholder="Your last name" />
                </div>
              </div>
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-charcoal-light mb-2">Email Address</label>
                <input type="email" className="w-full border-b border-cream-dark py-3 focus:outline-none focus:border-gold transition-colors bg-transparent font-serif" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-charcoal-light mb-2">Message</label>
                <textarea rows={4} className="w-full border-b border-cream-dark py-3 focus:outline-none focus:border-gold transition-colors bg-transparent font-serif resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <button type="button" className="bg-[#070707] hover:bg-gold text-white hover:text-black w-full py-4 font-sans text-xs uppercase tracking-[0.2em] font-bold transition-colors mt-4">
                Send Message
              </button>
            </form>
          </div>

          {/* CONTACT DETAILS */}
          <div className="flex flex-col justify-center space-y-12 lg:pl-10">
            
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-gold text-xs">✦</span>
                <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-dark font-bold">
                  GET IN TOUCH
                </span>
              </div>
              <h2 className="font-display text-4xl text-charcoal mb-6">We await your visit.</h2>
              <p className="font-serif text-lg text-charcoal/80 leading-relaxed">
                Whether you are looking for a bespoke piece, need assistance with an order, or wish to schedule a private consultation, our team is at your service.
              </p>
            </div>

            <div className="space-y-8 border-t border-cream-dark pt-8">
              
              <div className="flex items-start gap-4">
                <span className="text-gold-dark text-xl mt-1">✆</span>
                <div>
                  <h3 className="font-sans text-[11px] tracking-[0.2em] uppercase font-bold text-charcoal mb-1">Phone & WhatsApp</h3>
                  <p className="font-serif text-lg text-charcoal/90 mb-1">+91 94310 02445</p>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-charcoal-light">Available 10 AM - 8 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="text-gold-dark text-xl mt-1">✉</span>
                <div>
                  <h3 className="font-sans text-[11px] tracking-[0.2em] uppercase font-bold text-charcoal mb-1">Email Address</h3>
                  <p className="font-serif text-lg text-charcoal/90 mb-1">
                    <a href="mailto:Tjewellers13@gmail.com" className="hover:text-gold-dark transition-colors">Tjewellers13@gmail.com</a>
                  </p>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-charcoal-light">For general inquiries</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="text-gold-dark text-xl mt-1">◎</span>
                <div>
                  <h3 className="font-sans text-[11px] tracking-[0.2em] uppercase font-bold text-charcoal mb-1">Flagship Store</h3>
                  <p className="font-serif text-lg text-charcoal/90 leading-relaxed mb-1">
                    Shop no 120, 1st floor, GV mall,<br />Boring road, Patna 800001
                  </p>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-charcoal-light">Mon-Sun: 10:00 AM - 8:00 PM</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
