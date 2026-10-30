import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHero from '../components/PageHero';
import ServiceDetail from '../components/ServiceDetail';

export default function ServicesPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const scrollToTarget = () => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
        return false;
      };

      if (!scrollToTarget()) {
        setTimeout(scrollToTarget, 120);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title="Focused education support tailored to your goals."
        description="Explore our core offerings with dedicated guidance for every step of the journey."
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-8">
          <ServiceDetail
            id="research"
            title="Research Centre"
            description="Applied research support for learners, educators, and institutions."
            points={[
              'Research design and methodology support',
              'Academic writing and publication guidance',
              'Collaborative research advisory'
            ]}
          />
          <ServiceDetail
            id="projects"
            title="Impact Projects"
            description="Project-based initiatives designed for measurable educational and social outcomes."
            points={[
              'End-to-end project planning',
              'Implementation and monitoring support',
              'Impact reporting and evaluation'
            ]}
          />
          <ServiceDetail
            id="archive"
            title="Research Archive"
            description="A curated archive of research outputs, learning resources, and institutional insights."
            points={[
              'Open-access knowledge resources',
              'Structured research repositories',
              'Practical tools for educators and researchers'
            ]}
          />
          <ServiceDetail
            id="courses"
            title="Short Courses & Certifications"
            description="Research-focused programs built for rapid skill development and global recognition."
            points={[
              'Evidence-based curriculum design',
              'Flexible delivery formats',
              'Globally aligned certification'
            ]}
          />
          <ServiceDetail
            id="training"
            title="Workshops & Training"
            description="Expert-led sessions for educators, professionals, and organizational teams."
            points={[
              'Faculty and staff upskilling',
              'Applied research methods',
              'Customized training cohorts'
            ]}
          />
          <ServiceDetail
            id="conferences"
            title="Conferences & Seminars"
            description="International academic events fostering collaboration and knowledge exchange."
            points={[
              'End-to-end event design',
              'Global speaker curation',
              'Impact measurement & reporting'
            ]}
          />
          <ServiceDetail
            id="professional"
            title="Professional Development & Onboarding"
            description="Structured programs that build research literacy and workforce capacity."
            points={[
              'Employee retention strategies',
              'Onboarding solutions',
              'Measurable outcomes'
            ]}
          />
          <ServiceDetail
            id="grants"
            title="Grants & Scholarships"
            description="Funding and support pathways for emerging researchers and underserved communities."
            points={[
              'Grant opportunity advisory',
              'Scholarship readiness support',
              'Partner funding pathways'
            ]}
          />
          <ServiceDetail
            id="awards"
            title="Recognition & Impact Awards"
            description="Award initiatives that celebrate excellence, innovation, and measurable educational impact."
            points={[
              'Recognition programs for educators and scholars',
              'Impact-based award categories',
              'Transparent nomination and selection support'
            ]}
          />
        </div>
      </section>
    </>
  );
}
