export function AboutSection() {
  return (
    <section className="about" id="about">
      <div className="container">
        <div className="about-grid">
          <div className="about-content">
            <div className="hero-pill" style={{ background: "var(--lp-accent-light)", color: "var(--lp-accent)" }}>
              The BUDDIES Mission
            </div>
            <h2 className="about-title">About BUDDIES</h2>
            <div className="about-text">
              <p>
                <strong>BUDDIES</strong> is a comprehensive AI-powered web platform developed to support students and
                job seekers in preparing for placements, competitive examinations, and professional interviews. It
                provides an integrated digital learning ecosystem where users can continuously practice, evaluate, and
                enhance their skills in a structured and efficient manner.
              </p>

              <p>
                The platform features a <strong>secure authentication system</strong> with multiple user roles,
                including students, faculty members, and administrators, ensuring personalized experiences and
                controlled access. After logging in, users are presented with a{" "}
                <strong>dynamic and interactive dashboard</strong> that displays detailed performance metrics, progress
                tracking, and skill-level analysis through visually rich charts and reports. This allows users to
                clearly understand their strengths and identify areas that require improvement.
              </p>

              <p>
                The core of BUDDIES lies in its <strong>aptitude training module</strong>, which offers a wide
                variety of multiple-choice questions across key areas such as quantitative aptitude, logical reasoning,
                and verbal ability. These assessments are designed with time constraints, real-time feedback, and
                comprehensive result analysis, helping users build accuracy, speed, and confidence over time.
              </p>

              <p>
                Beyond basic practice, BUDDIES incorporates an <strong>advanced AI-based explanation system</strong>{" "}
                that delivers step-by-step solutions and concept-based explanations for each question, enabling deeper
                understanding rather than rote learning. The platform also includes a highly{" "}
                <strong>interactive mock interview module</strong> that simulates real-world interview environments,
                covering both HR and technical questions through a chat-based interface.
              </p>

              <p>
                Additionally, BUDDIES offers a <strong>powerful resume analysis tool</strong> that evaluates resumes
                using industry-relevant standards and provides an ATS (Applicant Tracking System) score along with
                actionable suggestions to improve visibility and selection chances. The platform further enhances user
                engagement through <strong>company-specific preparation modules</strong> tailored to different job roles
                and industries, allowing focused learning.
              </p>

              <p>
                Features such as <strong>leaderboards, progress badges, and gamification elements</strong> motivate
                users by introducing a sense of competition and achievement. A dedicated <strong>faculty portal</strong>{" "}
                enables instructors to monitor student performance, track progress, and provide guidance, while the
                admin panel ensures smooth management of users and system functionalities. Overall, BUDDIES serves as
                an all-in-one, user-friendly solution that not only strengthens aptitude and technical knowledge but
                also prepares individuals holistically for real-world career challenges and opportunities.
              </p>
            </div>
          </div>
          <div className="about-visual">
            <div className="about-card-stack">
              <div className="a-card">
                <div className="a-icon" style={{ background: "#1B6FE6" }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    width="20"
                    height="20"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h4>AI Driven</h4>
                  <p>Intelligent explanations</p>
                </div>
              </div>
              <div className="a-card">
                <div className="a-icon" style={{ background: "#8B5CF6" }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    width="20"
                    height="20"
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h4>Interactive Mocks</h4>
                  <p>Real-world simulation</p>
                </div>
              </div>
              <div className="a-card">
                <div className="a-icon" style={{ background: "#10B981" }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    width="20"
                    height="20"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <h4>ATS Analysis</h4>
                  <p>Resume optimization</p>
                </div>
              </div>
              <div className="a-card">
                <div className="a-icon" style={{ background: "#F59E0B" }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    width="20"
                    height="20"
                  >
                    <path d="M3 21h18M3 7v1h18V7M3 10v11h18V10M12 1v6M9 1v6M15 1v6" />
                  </svg>
                </div>
                <div>
                  <h4>MNC Simulation</h4>
                  <p>Real company test patterns</p>
                </div>
              </div>
              <div className="a-card">
                <div className="a-icon" style={{ background: "#EC4899" }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    width="20"
                    height="20"
                  >
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                </div>
                <div>
                  <h4>Live Analytics</h4>
                  <p>Real-time skill tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
