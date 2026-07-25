import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Brain,
  Bot,
  HeartHandshake,
  LineChart,
  GraduationCap,
  MessageCircle,
  Play,
  ArrowRight,
  Smile,
  School,
  PartyPopper,
  Bus,
  Presentation,
  ShieldCheck,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { GridBackground } from "@/components/site/grid-background";
import { Sova } from "@/components/site/sova";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen">
      <GridBackground />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Journey />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 md:pt-24 lg:pt-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl animate-fade-in text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand)] animate-pulse" />
              AI Social Skills Training
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Learn Social Skills with <span className="text-gradient-brand">Adaptive AI</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg lg:mx-0 mx-auto">
              Sociova membantu anak dengan Autism Spectrum Disorder melatih komunikasi, mengenali
              emosi, dan membangun rasa percaya diri melalui pembelajaran adaptif berbasis
              Artificial Intelligence.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button
                asChild
                size="lg"
                className="rounded-full btn-brand border-0 h-12 px-6 text-base"
              >
                <Link to="/register">
                  Start Learning <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-12 px-6 text-base backdrop-blur bg-background/40"
              >
                <Play className="mr-1 h-4 w-4" /> Watch Demo
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> Adaptive Learning
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> AI Powered
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> Child Friendly
              </span>
            </div>
          </div>
          <HeroSovaChat />
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroSovaChat() {
  return (
    <div className="relative mx-auto w-full max-w-[360px] shrink-0 sm:max-w-[380px] lg:block">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-[color:var(--brand)]/25 via-transparent to-[color:var(--brand-glow)]/25 blur-2xl" />
      <div className="absolute -left-8 -top-8 z-10">
        <Sova size={110} />
      </div>
      <Card className="glass overflow-hidden rounded-3xl p-0 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border/60 bg-background/40 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full btn-brand border-0 text-[10px] font-bold">
            S
          </div>
          <div className="text-sm font-medium">Sova</div>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[color:var(--success)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" /> Online
          </span>
        </div>
        <div className="space-y-2 p-4">
          <Bubble side="left">
            Halo! Aku Sova. Hari ini kita belajar berkenalan dengan teman baru. Siapa namamu?
          </Bubble>
          <Bubble side="right" brand>
            Namaku Bimo.
          </Bubble>
          <Bubble side="left">
            Senang bertemu denganmu, Bimo! Sekarang coba tanyakan nama temanmu juga.
          </Bubble>
          <div className="mt-3 rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Communication Score</span>
              <span className="font-semibold text-[color:var(--brand)]">86%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-secondary">
              <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-glow)]" />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">AI feedback:</span> Sapaanmu sudah sopan
              dan jelas.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-[color:var(--brand)]/25 via-transparent to-[color:var(--brand-glow)]/25 blur-2xl" />
      <Card className="glass overflow-hidden rounded-3xl p-0 shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-background/40 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--warning)]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--success)]/80" />
          <span className="ml-3 text-xs text-muted-foreground">sociova.ai / dashboard</span>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
          <PreviewCard
            icon={<Bot className="h-4 w-4" />}
            title="AI Simulation"
            caption="Practice: Meeting Friends"
          >
            <div className="mt-3 space-y-2">
              <Bubble side="left">Hi! I'm new here. Can I join?</Bubble>
              <Bubble side="right" brand>
                Of course! We're playing tag.
              </Bubble>
              <div className="mt-2 rounded-lg bg-secondary/60 p-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">AI feedback:</span> Great tone &
                eye-contact cue. +12 XP
              </div>
            </div>
          </PreviewCard>
          <PreviewCard
            icon={<Smile className="h-4 w-4" />}
            title="Emotion Analyzer"
            caption="Detected: Calm · 92%"
          >
            <div className="mt-3 space-y-2">
              {[
                { l: "Calm", v: 92, c: "var(--success)" },
                { l: "Curious", v: 64, c: "var(--brand)" },
                { l: "Anxious", v: 12, c: "var(--warning)" },
              ].map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{r.l}</span>
                    <span>{r.v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${r.v}%`,
                        background: `color-mix(in oklab, ${r.c} 90%, transparent)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PreviewCard>
          <PreviewCard
            icon={<LineChart className="h-4 w-4" />}
            title="Weekly Progress"
            caption="+18% this week"
          >
            <div className="mt-3 flex h-[92px] items-end gap-1.5">
              {[30, 42, 38, 55, 48, 66, 78].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-md bg-gradient-to-t from-[color:var(--brand)] to-[color:var(--brand-glow)]"
                  style={{ height: `${v}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>
          </PreviewCard>
        </div>
      </Card>
    </div>
  );
}

function PreviewCard({
  icon,
  title,
  caption,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand)]/40">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Bubble({
  children,
  side,
  brand,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  brand?: boolean;
}) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs ${brand ? "btn-brand border-0" : "bg-secondary text-foreground"}`}
      >
        {children}
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    { v: "10K+", l: "Training Sessions" },
    { v: "500+", l: "Parents & Therapists" },
    { v: "95%", l: "Satisfaction Rate" },
    { v: "24/7", l: "AI Companion" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur-sm"
          >
            <div className="font-display text-3xl font-bold text-gradient-brand">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Brain,
      title: "Adaptive Learning",
      desc: "Content evolves to each child's pace, sensitivity, and preferences.",
    },
    {
      icon: Bot,
      title: "AI Social Simulation",
      desc: "Safe, guided conversations to rehearse real-world social moments.",
    },
    {
      icon: Smile,
      title: "Emotion Analysis",
      desc: "Detect emotion from text and suggest calming, grounding exercises.",
    },
    {
      icon: LineChart,
      title: "Progress Tracking",
      desc: "Radar and trend charts across empathy, listening, and confidence.",
    },
    {
      icon: HeartHandshake,
      title: "Parent Dashboard",
      desc: "Weekly reports, downloadable PDFs, and shared milestones.",
    },
    {
      icon: GraduationCap,
      title: "Teacher Dashboard",
      desc: "Manage students, assignments, and classroom analytics.",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" /> AI-native learning
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          Built for real social growth
        </h2>
        <p className="mt-3 text-muted-foreground">
          Six intelligent modules that meet children where they are — and grow with them.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-[color:var(--brand)]/40 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--brand)]/10 text-[color:var(--brand)] transition-transform group-hover:scale-110">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Journey() {
  const steps = [
    { icon: MessageCircle, title: "Greeting", desc: "Confident hellos and simple introductions." },
    { icon: Smile, title: "Emotion", desc: "Understand feelings — yours and others'." },
    { icon: Bot, title: "Conversation", desc: "Turn-taking, listening, and staying on topic." },
    { icon: School, title: "School", desc: "Classroom routines and teacher interactions." },
    {
      icon: HeartHandshake,
      title: "Friendship",
      desc: "Building and keeping meaningful friendships.",
    },
    {
      icon: Presentation,
      title: "Presentation",
      desc: "Standing up and speaking with confidence.",
    },
    { icon: Bus, title: "Real World", desc: "Transportation, shopping, and public places." },
    { icon: PartyPopper, title: "Celebrate", desc: "Birthday parties and social celebrations." },
  ];
  return (
    <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          A guided journey, step by step
        </h2>
        <p className="mt-3 text-muted-foreground">
          Sociova unlocks age-appropriate scenarios as each child grows — moving from simple
          greetings all the way to real-world independence.
        </p>
      </div>
      <div className="relative mt-14">
        <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-[color:var(--brand)]/50 to-transparent md:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl btn-brand border-0">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-xs text-muted-foreground">Step {i + 1}</div>
              <div className="font-semibold">{s.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      name: "Amina, parent",
      role: "Mom of Zayd, 8",
      quote:
        "For the first time my son practices greetings without pressure. The AI is so patient and kind — I finally see him smiling during learning.",
    },
    {
      name: "Dr. Priya Rao",
      role: "Child Therapist",
      quote:
        "The emotion analyzer and radar charts give me measurable insight per session. It's a beautiful complement to therapy.",
    },
    {
      name: "Mr. Chen",
      role: "Special-ed teacher",
      quote:
        "The teacher dashboard is exactly what I needed. Assignments, progress, and IEP-friendly reporting in one place.",
    },
  ];
  return (
    <section id="resources" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          Loved by families & clinicians
        </h2>
        <p className="mt-3 text-muted-foreground">Real stories from the Sociova community.</p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {items.map((t) => (
          <Card
            key={t.name}
            className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm"
          >
            <div className="flex gap-1 text-[color:var(--warning)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-3 text-sm">"{t.quote}"</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full btn-brand border-0 text-xs font-semibold">
                {t.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Is Sociova a replacement for therapy?",
      a: "No. Sociova is a companion learning platform designed to complement therapy, school, and family support — never replace them.",
    },
    {
      q: "Which age range does it support?",
      a: "The adaptive engine tailors content from around age 5 through the teenage years, adjusting difficulty per child.",
    },
    {
      q: "How is my child's data protected?",
      a: "Data is encrypted in transit and at rest. We follow strict privacy-first principles and never sell personal data.",
    },
    {
      q: "Can teachers and parents both use it?",
      a: "Yes — Sociova provides distinct Parent and Teacher dashboards with shared progress across environments.",
    },
    {
      q: "Does it work offline?",
      a: "The core learning modules require internet, but recent sessions and story PDFs can be saved for offline reading.",
    },
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          Frequently asked
        </h2>
        <p className="mt-3 text-muted-foreground">Answers to what families ask us most.</p>
      </div>
      <Accordion type="single" collapsible className="mt-10">
        {faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="rounded-xl border border-border/60 bg-card/60 mb-2 px-4 backdrop-blur-sm"
          >
            <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-10 text-center backdrop-blur-sm md:p-16">
        <div className="absolute inset-0 -z-10 glow-radial opacity-70" />
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-xs">
          <ShieldCheck className="h-3 w-3 text-[color:var(--success)]" /> Privacy-first ·
          COPPA-friendly
        </div>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          Give every child a confident next step.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Join families and clinicians using Sociova to nurture communication, empathy, and
          independence.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full btn-brand border-0 h-12 px-6">
            <Link to="/register">Create free account</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full h-12 px-6 backdrop-blur bg-background/40"
          >
            <Link to="/dashboard">
              Explore dashboard <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
