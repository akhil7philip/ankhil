import { useEffect, useMemo, useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import { supabase } from '@/lib/supabase';

interface FAQItem {
  question: string;
  answer: string;
}

function buildFaqData(keralaNonVeg: boolean): FAQItem[] {
  return [
    {
      question: 'Which events should I attend?',
      answer:
        'All events are open to all guests! Guests are encouraged to attend as many events as possible.',
    },
    {
      question: 'What should I wear?',
      answer:
        'Each event has a suggested dress code noted in the Events section. For the Wedding Ceremony, traditional Indian attire is encouraged but not required.',
    },
    {
      question: 'Will accommodation be provided?',
      answer:
        'Please fill out the RSVP form with your accommodation preference. We will look into it and share accommodation details closer to the date.',
    },
    {
      question: 'What food will be served?',
      answer: keralaNonVeg
        ? 'The Kolkata events are fully vegetarian. The Pala reception has both vegetarian and non-vegetarian options — please indicate your preference in the RSVP.'
        : 'Only vegetarian food will be served at both weddings.',
    },
    {
      question: 'What about gifts?',
      answer:
        'Your presence is the greatest gift. Having you celebrate this day with us — in person or in spirit — is more than enough.',
    },
    {
      question: 'Will there be a livestream?',
      answer:
        "For loved ones who can't travel, we plan to share a livestream link for the main ceremony closer to the date. If you'd like to be sent the link, please let us know in the RSVP form or email us.",
    },
    {
      question: 'Who should I contact for more help?',
      answer:
        'For any questions, feel free to reach out to us at support@ankhil.club or call +91-8373987643.',
    },
  ];
}

function AccordionItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`bg-[#F5F1EB] rounded-[4px] transition-all duration-300 ${
        isOpen ? 'py-5 px-5 md:px-6' : 'py-4 px-5 md:px-6'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
        aria-expanded={isOpen}
      >
        <span className="font-sans-body text-[15px] font-semibold text-[#3B2F2F] group-hover:text-[#C4A055] transition-colors duration-200">
          {item.question}
        </span>
        <span className="font-serif-display text-xl text-[#C4A055] flex-shrink-0">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{
          maxHeight: isOpen ? '300px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="pt-4 border-t border-[rgba(59,47,47,0.1)] mt-4">
          <p className="font-sans-body text-sm text-[#3B2F2F]/85 leading-relaxed">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [keralaNonVeg, setKeralaNonVeg] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('site_config')
        .select('kerala_non_veg')
        .maybeSingle();
      if (!cancelled && data) setKeralaNonVeg(Boolean(data.kerala_non_veg));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const faqData = useMemo(() => buildFaqData(keralaNonVeg), [keralaNonVeg]);

  return (
    <section id="faq" className="bg-[#3B2F2F] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[800px] mx-auto">
        <ScrollReveal>
          <p className="section-label-light mb-3 md:mb-4">FAQ</p>
          <h2 className="section-heading-light mb-10 md:mb-12">
            Questions & Answers
          </h2>
        </ScrollReveal>

        <div className="space-y-3">
          {faqData.map((item, i) => (
            <ScrollReveal key={item.question} delay={i * 0.1}>
              <AccordionItem item={item} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
