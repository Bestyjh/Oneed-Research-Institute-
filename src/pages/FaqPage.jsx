import React from 'react';
import PageHero from '../components/PageHero';

const FAQ_ITEMS = [
  {
    q: 'Who does Oneed Institute serve?',
    a: 'Students, educators, institutions, and organizations seeking research-driven learning and professional development.'
  },
  {
    q: 'What programs do you offer?',
    a: 'Short courses, certifications, diploma pathways, workshops, conferences, and training initiatives.'
  },
  {
    q: 'Do you partner with institutions?',
    a: 'Yes. We collaborate with universities, colleges, and secondary schools in Canada and internationally.'
  },
  {
    q: 'How do we start a partnership?',
    a: 'Submit an inquiry and we will respond with a tailored roadmap within one business day.'
  }
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Answers to the questions we hear most."
        description="Clear guidance so you can move forward with confidence."
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl grid gap-6">
          {FAQ_ITEMS.map((faq) => (
            <div key={faq.q} className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
              <div className="text-lg font-semibold">{faq.q}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
