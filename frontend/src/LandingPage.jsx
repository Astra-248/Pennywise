
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowDown,
    ArrowRight,
    ArrowUpRight,
    ChartNoAxesCombined,
    ShieldCheck,
    Wallet,
    Target,
    CalendarDays,
    Check,
    TrendingUp,
    CircleDollarSign,
} from "lucide-react";

const periods = {
    "1W": {
        label: "Last 7 days",
        spent: 2840,
        budget: 4500,
        change: "7-day overview",
        bars: [
            { day: "M", value: 36 },
            { day: "T", value: 64 },
            { day: "W", value: 28 },
            { day: "T", value: 82 },
            { day: "F", value: 47 },
            { day: "S", value: 100 },
            { day: "S", value: 39 },
        ],
        categories: [
            { name: "Food", amount: 1180, percent: 42 },
            { name: "Travel", amount: 760, percent: 27 },
            { name: "Shopping", amount: 540, percent: 19 },
            { name: "Other", amount: 360, percent: 12 },
        ],
    },
    "1M": {
        label: "This month",
        spent: 12450,
        budget: 18000,
        change: "Monthly overview",
        bars: [
            { day: "W1", value: 44 },
            { day: "W2", value: 69 },
            { day: "W3", value: 52 },
            { day: "W4", value: 86 },
        ],
        categories: [
            { name: "Food", amount: 4200, percent: 76 },
            { name: "Travel", amount: 3100, percent: 56 },
            { name: "Shopping", amount: 2850, percent: 51 },
            { name: "Bills", amount: 2300, percent: 42 },
        ],
    },
    "3M": {
        label: "Last 3 months",
        spent: 35680,
        budget: 48000,
        change: "Quarterly overview",
        bars: [
            { day: "Aug", value: 62 },
            { day: "Sep", value: 79 },
            { day: "Oct", value: 53 },
        ],
        categories: [
            { name: "Food", amount: 12100, percent: 78 },
            { name: "Travel", amount: 8950, percent: 58 },
            { name: "Shopping", amount: 8100, percent: 52 },
            { name: "Bills", amount: 6530, percent: 42 },
        ],
    },
};

const features = [
    {
        icon: ChartNoAxesCombined,
        number: "01",
        title: "Understand your spending",
        description:
            "Turn everyday transactions into a clearer picture of where your money actually goes.",
    },
    {
        icon: Wallet,
        number: "02",
        title: "Give your budget a purpose",
        description:
            "Set a monthly spending limit and see how much remains as your expenses add up.",
    },
    {
        icon: Target,
        number: "03",
        title: "Make room for your goals",
        description:
            "Build better money habits with a plan that makes your priorities easier to see.",
    },
    {
        icon: CalendarDays,
        number: "04",
        title: "Keep everything in view",
        description:
            "Review transactions, organise spending, and look back at your monthly progress.",
    },
];

function money(amount) {
    return "₹" + amount.toLocaleString("en-IN");
}

function useReveal() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const element = sectionRef.current;

        if (!element) {
            return;
        }

        if (!("IntersectionObserver" in window)) {
            element.classList.add("is-visible");
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return sectionRef;
}

function DashboardPreview() {
    const [period, setPeriod] = useState("1M");
    const data = periods[period];
    const remaining = data.budget - data.spent;
    const percent = Math.round((data.spent / data.budget) * 100);

    return (
        <div className="preview-wrap">
            <div className="preview-orbit" />

            <div className="preview-window">
                <div className="preview-topbar">
                    <div className="preview-brand">
                        <span className="preview-brand-mark">p.</span>
                        <span>pennywise</span>
                    </div>
                    <span className="preview-live">
            <span />
            LIVE PREVIEW
          </span>
                </div>

                <div className="preview-content">
                    <div className="preview-heading">
                        <div>
                            <p className="preview-muted">YOUR FINANCES</p>
                            <h3>At a glance.</h3>
                        </div>
                        <div className="preview-periods" aria-label="Chart time period">
                            {Object.keys(periods).map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    className={period === item ? "selected" : ""}
                                    onClick={() => setPeriod(item)}
                                    aria-pressed={period === item}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="preview-total">
                        <div>
                            <p className="preview-muted">{data.label.toUpperCase()}</p>
                            <div className="preview-amount" key={period}>
                                {money(data.spent)}
                            </div>
                        </div>
                        <div className="preview-trend">
                            <TrendingUp size={15} />
                            <span>{data.change}</span>
                        </div>
                    </div>

                    <div className="preview-chart-card">
                        <div className="preview-card-heading">
                            <span>Spending activity</span>
                            <span className="preview-chart-caption">Illustrative data</span>
                        </div>

                        <div className="preview-chart" key={period}>
                            {data.bars.map((bar, index) => (
                                <div className="preview-bar-column" key={bar.day}>
                                    <div className="preview-bar-track">
                                        <div
                                            className={
                                                "preview-bar" +
                                                (index === data.bars.length - 1
                                                    ? " preview-bar-highlight"
                                                    : "")
                                            }
                                            style={{
                                                height: bar.value + "%",
                                                animationDelay: index * 65 + "ms",
                                            }}
                                        />
                                    </div>
                                    <span>{bar.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="preview-budget-card">
                        <div className="preview-budget-top">
                            <div className="preview-budget-icon">
                                <Wallet size={17} />
                            </div>
                            <div className="preview-budget-title">
                                <span>Monthly budget</span>
                                <strong>{money(data.budget)}</strong>
                            </div>
                            <span className="preview-budget-percent">{percent}%</span>
                        </div>

                        <div className="preview-budget-track">
                            <div
                                className="preview-budget-fill"
                                style={{ width: percent + "%" }}
                            />
                        </div>

                        <div className="preview-budget-bottom">
                            <span>{money(data.spent)} spent</span>
                            <span>{money(remaining)} left</span>
                        </div>
                    </div>

                    <div className="preview-category-card">
                        <div className="preview-card-heading">
                            <span>Where it goes</span>
                            <span className="preview-card-link">By category</span>
                        </div>

                        {data.categories.map((item, index) => (
                            <div className="preview-category" key={item.name}>
                                <div className="preview-category-label">
                  <span>
                    <i className={"category-dot category-dot-" + index} />
                      {item.name}
                  </span>
                                    <strong>{money(item.amount)}</strong>
                                </div>
                                <div className="preview-category-track">
                                    <div
                                        className={"preview-category-fill category-fill-" + index}
                                        style={{ width: item.percent + "%" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="preview-disclaimer">
                        Interactive demo · Figures are illustrative, not personal financial data.
                    </p>
                </div>
            </div>

            <div className="preview-floating-note">
        <span className="floating-note-icon">
          <CircleDollarSign size={19} />
        </span>
                <span>
          <strong>{money(remaining)}</strong>
          <small>Still within your plan</small>
        </span>
                <Check size={17} className="floating-note-check" />
            </div>
        </div>
    );
}

function LandingPage() {
    const featuresRef = useReveal();
    const demoRef = useReveal();
    const closingRef = useReveal();

    return (
        <div className="landing-page">
            <header className="landing-header">
                <nav className="landing-nav">
                    <Link to="/" className="landing-brand" aria-label="Pennywise home">
                        <span className="landing-brand-mark">p.</span>
                        <span>
              pennywise<span className="brand-period">.</span>
            </span>
                    </Link>

                    <div className="landing-nav-links">
                        <a href="#features">Features</a>
                        <a href="#preview">Preview</a>
                        <a href="#how-it-works">Our approach</a>
                    </div>

                    <Link to="/dashboard" className="landing-nav-cta">
                        Open app <ArrowUpRight size={16} />
                    </Link>
                </nav>
            </header>

            <main>
                <section className="landing-hero">
                    <div className="hero-grain" />

                    <div className="hero-copy">
                        <div className="hero-kicker">
                            <span className="hero-kicker-dot" />
                            PERSONAL FINANCE, WITH CLARITY
                        </div>

                        <h1>
                            A little more
                            <br />
                            intention.
                            <br />
                            <span>A lot more</span>
                            <br />
                            <span className="hero-outline">possibility.</span>
                        </h1>

                        <p className="hero-description">
                            Your money deserves more than guesswork. Track your spending,
                            plan your month, and make every rupee count.
                        </p>

                        <div className="hero-actions">
                            <Link to="/dashboard" className="hero-primary-btn">
                                Start managing money <ArrowRight size={17} />
                            </Link>
                            <a href="#preview" className="hero-secondary-btn">
                                Explore the preview <ArrowDown size={16} />
                            </a>
                        </div>

                        <div className="hero-proof">
              <span>
                <Check size={14} /> Expense tracking
              </span>
                            <span>
                <Check size={14} /> Monthly budgets
              </span>
                            <span>
                <Check size={14} /> Spending insights
              </span>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <DashboardPreview />
                    </div>

                    <div className="hero-index">
                        <span>01 / 03</span>
                        <span>YOUR MONEY, REIMAGINED</span>
                    </div>
                </section>

                <section className="landing-marquee" aria-label="Pennywise principles">
                    <div className="marquee-track">
                        {[0, 1].map((copy) => (
                            <div className="marquee-group" key={copy} aria-hidden={copy === 1}>
                                <span>Spend with intention</span>
                                <i />
                                <span>Save with purpose</span>
                                <i />
                                <span>Know where it goes</span>
                                <i />
                                <span>Build better habits</span>
                                <i />
                            </div>
                        ))}
                    </div>
                </section>

                <section id="features" className="features-section reveal-section" ref={featuresRef}>
                    <div className="section-topline">
                        <span>THE ESSENTIALS</span>
                        <span>DESIGNED FOR REAL LIFE</span>
                    </div>

                    <div className="features-intro">
                        <div>
                            <p className="section-eyebrow">LESS NOISE. MORE CLARITY.</p>
                            <h2>
                                Your finances,
                                <br />
                                <span>in better focus.</span>
                            </h2>
                        </div>

                        <p className="features-intro-copy">
                            Personal finance doesn't need to be complicated. Start with the
                            basics, build awareness, and make decisions with more confidence.
                        </p>
                    </div>

                    <div className="feature-grid">
                        {features.map((feature) => {
                            const Icon = feature.icon;

                            return (
                                <article className="feature-card" key={feature.number}>
                                    <div className="feature-card-top">
                                        <span className="feature-number">{feature.number}</span>
                                        <span className="feature-icon">
                      <Icon size={21} strokeWidth={1.7} />
                    </span>
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                    <span className="feature-card-line" />
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section id="preview" className="demo-section reveal-section" ref={demoRef}>
                    <div className="demo-copy">
                        <p className="section-eyebrow">TAKE A CLOSER LOOK</p>
                        <h2>
                            Not just numbers.
                            <br />
                            <span>A clearer picture.</span>
                        </h2>
                        <p>
                            Try the time-range controls in the preview. See how the spending
                            summary, budget progress, and category breakdown respond.
                        </p>
                        <div className="demo-note">
              <span className="demo-note-mark">
                <ShieldCheck size={19} />
              </span>
                            <span>
                <strong>A preview, not your account</strong>
                <small>Sample figures let you explore before opening the app.</small>
              </span>
                        </div>
                    </div>

                    <div className="demo-side-card">
                        <div className="demo-side-number">01—03</div>
                        <h3>Small steps can change how you see your money.</h3>
                        <p>
                            Record an expense. Set a limit. Review your progress. Start
                            building a routine that works for you.
                        </p>
                        <Link to="/dashboard" className="demo-side-link">
                            Explore your dashboard <ArrowUpRight size={17} />
                        </Link>
                    </div>
                </section>

                <section
                    id="how-it-works"
                    className="closing-section reveal-section"
                    ref={closingRef}
                >
                    <div className="closing-rule" />
                    <p className="section-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
                    <h2>
                        Know your money.
                        <br />
                        <span>Choose your direction.</span>
                    </h2>
                    <p>
                        A clearer view of today can help you plan more confidently for
                        tomorrow.
                    </p>
                    <Link to="/dashboard" className="closing-cta">
                        Open Pennywise <ArrowRight size={18} />
                    </Link>
                    <div className="closing-decoration" aria-hidden="true">
                        p.
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <Link to="/" className="landing-brand">
                    <span className="landing-brand-mark">p.</span>
                    <span>
            pennywise<span className="brand-period">.</span>
          </span>
                </Link>
                <p>Spend mindfully. Save intentionally.</p>
                <span>© {new Date().getFullYear()} PENNYWISE</span>
            </footer>
        </div>
    );
}

export default LandingPage;
