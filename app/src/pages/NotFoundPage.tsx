import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="bg-[#F5F1EB] min-h-screen flex items-center justify-center px-5 md:px-10 py-20">
      <div className="max-w-[600px] text-center">
        {/* Decorative flourish — site's recurring motif: gold rule + ampersand + gold rule */}
        <div className="mb-10 md:mb-12 flex items-center justify-center gap-5 md:gap-7">
          <div className="w-12 md:w-16 h-px bg-[#C4A055]" />
          <span className="font-serif-display italic text-[88px] md:text-[128px] leading-none text-[#C4A055]">
            &amp;
          </span>
          <div className="w-12 md:w-16 h-px bg-[#C4A055]" />
        </div>

        <p className="section-label mb-3 md:mb-4">404</p>
        <h1 className="section-heading mb-4 md:mb-5">Page Not Found</h1>
        <p className="font-sans-body text-base md:text-[17px] text-[#3B2F2F]/70 leading-relaxed mb-10 md:mb-12 max-w-[480px] mx-auto">
          The page you were looking for has wandered off. Let&rsquo;s get you back to where
          the celebration is.
        </p>

        <Link
          to="/"
          className="inline-block bg-[#3B2F2F] text-white font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-10 py-3.5 hover:bg-[#C4A055] transition-colors duration-300"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
