import ScrollReveal from './ScrollReveal';

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#F5F1EB] py-20 pb-10 px-5 md:px-10">
      <ScrollReveal className="max-w-[600px] mx-auto text-center flex flex-col items-center gap-6">
        {/* Initials */}
        <div>
          <p className="font-serif-display text-xl tracking-[0.15em] text-[#3B2F2F]">
            A&A
          </p>
          <div className="w-[60px] h-px bg-[#C4A055] mx-auto mt-3" />
        </div>

        {/* Contact text */}
        <p className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]">
          For any questions, please reach out
        </p>

        {/* Phone/Email */}
        <p className="font-sans-body text-xs text-[#3B2F2F]/70">
          <a href="mailto:support@ankhil.club" className="hover:text-[#C4A055] transition-colors duration-200">
            support@ankhil.club
          </a>
          {' \u2022 '}
          <a href="tel:+918373987643" className="hover:text-[#C4A055] transition-colors duration-200">
            +91-8373987643
          </a>
        </p>

        {/* Closing message */}
        <p className="font-serif-display text-lg italic text-[#3B2F2F]/70 max-w-[400px] leading-relaxed mt-2">
          With love, gratitude, and excitement — we can't wait to celebrate with you.
        </p>

        {/* Hashtag */}
        <p className="font-sans-body text-[13px] font-semibold uppercase tracking-[0.15em] text-[#C4A055]">
          #AnkitaAndAkhil
        </p>

        {/* Copyright */}
        <p className="font-sans-body text-[10px] tracking-[0.1em] text-[#3B2F2F]/50 mt-4">
          &copy; 2026 Ankita &amp; Akhil
        </p>
      </ScrollReveal>
    </footer>
  );
}
