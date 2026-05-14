import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="bg-[#F5F1EB] min-h-screen flex items-center justify-center px-5 md:px-10 py-20">
      <div className="max-w-[600px] text-center">
        {/* Blue */}
        <div className="mb-8 md:mb-10 flex justify-center">
          <img
            src="/images/blue_comp.jpg"
            alt="Blue, the dog, wearing cool sunglasses"
            className="w-[150px] h-[150px] md:w-[180px] md:h-[180px] rounded-full object-cover shadow-[0_6px_24px_rgba(59,47,47,0.2)] ring-2 ring-[#C4A055] ring-offset-4 ring-offset-[#F5F1EB]"
          />
        </div>

        <p className="section-label mb-4 md:mb-5">404 &middot; Page Not Found</p>

        <blockquote className="font-serif-display italic text-[22px] md:text-[26px] text-[#3B2F2F] leading-snug max-w-[520px] mx-auto mb-3">
          &ldquo;I sniffed every corner. This page isn&rsquo;t here. The celebration is that way.&rdquo;
        </blockquote>
        <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B6914] mb-10 md:mb-12">
          &mdash; Blue
        </p>

        <Link
          to="/"
          className="inline-block bg-[#3B2F2F] text-white font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-10 py-3.5 hover:bg-[#C4A055] transition-colors duration-300"
        >
          Back to the Celebration
        </Link>
      </div>
    </section>
  );
}
