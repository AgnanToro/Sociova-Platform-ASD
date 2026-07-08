import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer id="contact" className="relative mt-24 border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Sociova is an adaptive AI companion helping children on the autism spectrum build
            communication, confidence and emotional intelligence — one step at a time.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">
              Adaptive Learning
            </span>
            <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">
              AI Powered
            </span>
            <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">
              Child Friendly
            </span>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="/#features" className="hover:text-foreground">
                Features
              </a>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
            </li>
            <li>
              <a href="/#resources" className="hover:text-foreground">
                Resources
              </a>
            </li>
            <li>
              <a href="/#faq" className="hover:text-foreground">
                FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="/#about" className="hover:text-foreground">
                About
              </a>
            </li>
            <li>
              <a href="mailto:hello@sociova.ai" className="hover:text-foreground">
                Contact
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">
                Privacy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">
                Terms
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Sociova. Adaptive AI for social skills.</p>
          <p>Built with care for the ASD community.</p>
        </div>
      </div>
    </footer>
  );
}
