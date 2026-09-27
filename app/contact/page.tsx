import type { Metadata } from "next";
import { InquiryForm } from "@/components/InquiryForm";
import { Emblem, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: "Have an idea? Tell me what you’re thinking — let’s turn it into something real.",
};

export default function ContactPage() {
  return (
    <section className="shell grid gap-14 pt-10 pb-24 lg:grid-cols-12 lg:gap-12 lg:pt-16 lg:pb-32">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-32">
          <Eyebrow>Start a Project</Eyebrow>
          <h1 className="headline mt-6 text-[clamp(3rem,8vw,6rem)] leading-[0.9]">Have an idea?</h1>
          <p className="mt-6 max-w-md text-lg text-muted">Tell me what you’re thinking. Let’s turn it into something real.</p>
          <Emblem className="mt-14 hidden w-full max-w-[300px] lg:block" />
        </div>
      </div>
      <div className="lg:col-span-7">
        <InquiryForm />
      </div>
    </section>
  );
}
