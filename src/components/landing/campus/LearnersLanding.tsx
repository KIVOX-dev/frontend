import { Icon, MoreArrow, Split } from "./primitives";

// Learners landing (/): drives, round tracking, reports and offer letters for students.
// Every product preview shows sample data and says so.
export function LearnersLanding() {
  return (
    <>
      <div className="row">
        <div className="hero">
          <span className="eb rv">
            <i></i>For students · first year to final year
          </span>
          <Split as="h1" className="dt h1 anim">
            Your path from campus to your first offer
          </Split>
          <p className="lede rv" style={{ "--i": "2" }}>
            See every drive you&apos;re eligible for, know where you stand in each round, and keep your reports and offer letter
            in one place.
          </p>
          <div className="ctas rv" style={{ "--i": "3" }}>
            <a className="btn btn-dark" href="#l-features">
              Explore features
              <Icon name="arrow" />
            </a>
            <a className="btn btn-line" href="#l-how">
              How it works
            </a>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" style={{ paddingInline: "var(--gut)" }}>
        <div className="show anim" role="img" aria-label="Student app preview with sample data">
          <div className="pan-bg" style={{ "--pc": "var(--p-blue)" }}></div>
          <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/hero.jpg')" }}></div>
          <div className="show-ui">
            <div className="phone-stage">
              <div className="phone" aria-label="Student app preview with sample data">
                <div className="screen">
                  <span className="notch"></span>
                  <div className="ph-top">
                    <div>
                      <small>Final year · B.Sc CS</small>
                      <b>Hi, Meera</b>
                    </div>
                    <span className="st warn">Sample data</span>
                  </div>
                  <div className="ph-body rows">
                    <div className="ph-card next" style={{ "--r": "0" }}>
                      <small>NEXT ROUND · TODAY 2:30 PM</small>
                      <b>Technical interview</b>
                      <span>Company A · Graduate Trainee · Panel 2</span>
                    </div>
                    <div className="ph-card" style={{ "--r": "1" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <b style={{ fontSize: "13.5px" }}>Company A · your rounds</b>
                        <span className="st info">Round 3 of 4</span>
                      </div>
                      <div className="rounds">
                        <div className="rd done">
                          <span className="dot">
                            <Icon name="tick" />
                          </span>
                          <div>
                            <b>Applied</b>
                            <small>12 Sep</small>
                          </div>
                          <em></em>
                        </div>
                        <div className="rd done">
                          <span className="dot">
                            <Icon name="tick" />
                          </span>
                          <div>
                            <b>Aptitude test</b>
                            <small>Cut-off 60</small>
                          </div>
                          <em className="num">74 / 100</em>
                        </div>
                        <div className="rd now">
                          <span className="dot"></span>
                          <div>
                            <b>Technical interview</b>
                            <small>Today</small>
                          </div>
                          <em></em>
                        </div>
                        <div className="rd">
                          <span className="dot"></span>
                          <div>
                            <b>HR interview</b>
                            <small>After results</small>
                          </div>
                          <em></em>
                        </div>
                      </div>
                    </div>
                    <div className="ph-card" style={{ "--r": "2" }}>
                      <b style={{ fontSize: "13.5px", display: "block", marginBottom: "10px" }}>Drives for you</b>
                      <div className="ph-list">
                        <div className="ph-li">
                          <span className="av">B</span>
                          <div className="t">
                            <b>Company B · Support Engineer</b>
                            <small>Closes 30 Sep</small>
                          </div>
                          <span className="st ok">Eligible</span>
                        </div>
                        <div className="ph-li">
                          <span className="av">C</span>
                          <div className="t">
                            <b>Company C · Analyst</b>
                            <small>Closes 4 Oct</small>
                          </div>
                          <span className="st ok">Eligible</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tabbar">
                    <span className="on">
                      <Icon name="house" />
                      Home
                    </span>
                    <span>
                      <Icon name="megaphone" />
                      Drives
                    </span>
                    <span>
                      <Icon name="target" />
                      Reports
                    </span>
                    <span>
                      <Icon name="user" />
                      Profile
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row">
        <div className="mq-row-wrap" aria-label="Everything a student needs">
          <span className="eb">
            <i></i>Everything a student needs
          </span>
          <div className="mq-mask">
            <div className="mq" aria-hidden="true">
              <div className="mq-seq">
                <span>Eligible drives</span>
                <span>Round results</span>
                <span>Aptitude reports</span>
                <span>Offer letters</span>
                <span>Four-year Skill Report</span>
                <span>Drive dates</span>
                <span>Result alerts</span>
                <span>One-tap applications</span>
              </div>
              <div className="mq-seq">
                <span>Eligible drives</span>
                <span>Round results</span>
                <span>Aptitude reports</span>
                <span>Offer letters</span>
                <span>Four-year Skill Report</span>
                <span>Drive dates</span>
                <span>Result alerts</span>
                <span>One-tap applications</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="l-features">
        <div className="head split2">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <span className="eb rv">
              <i></i>What you get
            </span>
            <Split as="h2" className="dt h2 anim">
              Built for students, not spreadsheets
            </Split>
          </div>
          <p className="lede rv" style={{ "--i": "2" }}>
            No more waiting outside the placement office or scrolling group chats for updates.
          </p>
        </div>
      </div>
      <div className="rule"></div>

      <div className="row">
        <div className="cells">
          <article className="cl w2 rv" style={{ "--i": "0" }}>
            <span className="k">01 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-blue)" }}>
              <div className="vis-in">
                <div className="mini-row">
                  <span className="mini-l">
                    <Icon name="check" style={{ color: "var(--ok)" }} />
                    CGPA 7.0 or above · yours is 8.1
                  </span>
                  <span className="st ok">Met</span>
                </div>
                <div className="mini-row">
                  <span className="mini-l">
                    <Icon name="check" style={{ color: "var(--ok)" }} />
                    No active backlogs
                  </span>
                  <span className="st ok">Met</span>
                </div>
                <div className="mini-row">
                  <span className="mini-l">
                    <Icon name="x" style={{ color: "var(--bad)" }} />
                    B.E. Mechanical only
                  </span>
                  <span className="st mute">Not met</span>
                </div>
              </div>
            </div>
            <h3>Only drives you qualify for</h3>
            <p>Eligibility is checked against your own record before you apply.</p>
          </article>
          <article className="cl rv" style={{ "--i": "1" }}>
            <span className="k">02 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-mint)" }}>
              <div className="vis-in">
                <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center" }}>
                  <svg className="dial" viewBox="0 0 84 84">
                    <circle cx="42" cy="42" r="34" fill="none" stroke="#EEF2F7" strokeWidth="8"></circle>
                    <circle
                      cx="42"
                      cy="42"
                      r="34"
                      fill="none"
                      stroke="#0563F9"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="213.6"
                      strokeDashoffset="55.5"
                      transform="rotate(-90 42 42)"
                    ></circle>
                    <text
                      x="42"
                      y="48"
                      textAnchor="middle"
                      fontSize="18"
                      fontWeight="700"
                      fill="#06262B"
                      fontFamily="Figtree,sans-serif"
                    >
                      74
                    </text>
                  </svg>
                  <span style={{ color: "var(--ink-2)", maxWidth: "14ch" }}>Aptitude score, cut-off 60</span>
                </div>
              </div>
            </div>
            <h3>Section-wise scores</h3>
            <p>Know your strongest and weakest sections.</p>
          </article>
          <article className="cl rv" style={{ "--i": "2" }}>
            <span className="k">03 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-sand)" }}>
              <div className="vis-in">
                <div className="file">
                  <span className="pdf">PDF</span>
                  <div className="t">
                    <b>Offer_Letter_CompanyE.pdf</b>
                    <small>Uploaded 19 Sep</small>
                  </div>
                  <span className="st ok">Verified</span>
                </div>
              </div>
            </div>
            <h3>Offer letter, kept safe</h3>
            <p>Upload once. The placement cell verifies it.</p>
          </article>
          <article className="cl rv" style={{ "--i": "0" }}>
            <span className="k">04 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-sky)" }}>
              <div className="vis-in">
                <div className="steps5">
                  <span className="d"></span>
                  <span className="d"></span>
                  <span className="n"></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="steps5-l">
                  <span>Applied</span>
                  <span>Aptitude</span>
                  <span>Technical</span>
                  <span>HR</span>
                  <span>Offer</span>
                </div>
              </div>
            </div>
            <h3>Every round, tracked</h3>
            <p>See each result the moment a round closes.</p>
          </article>
          <article className="cl rv" style={{ "--i": "1" }}>
            <span className="k">05 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-blue)" }}>
              <div className="vis-in">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
                  <div
                    style={{ borderTop: "3px solid var(--accent)", paddingTop: "8px", color: "var(--ink-2)", fontSize: "11.5px" }}
                  >
                    Year 1
                  </div>
                  <div
                    style={{ borderTop: "3px solid var(--accent)", paddingTop: "8px", color: "var(--ink-2)", fontSize: "11.5px" }}
                  >
                    Year 2
                  </div>
                  <div
                    style={{ borderTop: "3px solid var(--accent)", paddingTop: "8px", color: "var(--ink-2)", fontSize: "11.5px" }}
                  >
                    Year 3
                  </div>
                  <div
                    style={{
                      borderTop: "3px solid var(--stone-2)",
                      paddingTop: "8px",
                      color: "var(--ink-2)",
                      fontSize: "11.5px",
                    }}
                  >
                    Year 4
                  </div>
                </div>
                <div className="mini-row">
                  <span>Hackathon · Internship · Certificates</span>
                  <span className="st info">Verified</span>
                </div>
              </div>
            </div>
            <h3>
              Skill Report <span className="soon">In development</span>
            </h3>
            <p>Training, projects and certificates, verified by your college.</p>
          </article>
        </div>
      </div>

      <div className="rule"></div>
      <div className="stack">
        <div className="row stk" id="l-drives">
          <div className="split">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Drives
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Only the drives you can apply to
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Each drive shows its package, rounds and eligibility rules checked against your own record, so you know before you
                apply.
              </p>
              <ul className="ticks rv" style={{ "--i": "3" }}>
                <li>
                  <Icon name="check" />
                  CGPA, backlogs and department checked for you
                </li>
                <li>
                  <Icon name="check" />
                  Apply in one tap
                </li>
              </ul>
              <a className="more rv" style={{ "--i": "4" }} href="#l-rounds">
                Next: round tracker
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-blue)" }}></div>
              <div className="pan-ui">
                <div className="drives" style={{ marginTop: "40px" }}>
                  <article className="drive" style={{ "--i": "0" }}>
                    <div className="top">
                      <span className="av">B</span>
                      <div>
                        <h3>Support Engineer</h3>
                        <small>Company B · Chennai</small>
                      </div>
                    </div>
                    <dl>
                      <dt>Package</dt>
                      <dd className="num">3.8 LPA</dd>
                      <dt>Drive date</dt>
                      <dd>7 Oct</dd>
                      <dt>Rounds</dt>
                      <dd>Aptitude, Technical, HR</dd>
                    </dl>
                    <ul className="elig">
                      <li>
                        <Icon name="check" />
                        CGPA 7.0 or above · yours is 8.1
                      </li>
                      <li>
                        <Icon name="check" />
                        No active backlogs
                      </li>
                      <li>
                        <Icon name="check" />
                        B.Sc CS, BCA, B.E. CSE
                      </li>
                    </ul>
                    <a className="btn btn-primary btn-sm" href="#l-rounds">
                      Apply
                    </a>
                  </article>
                  <article className="drive" style={{ "--i": "1" }}>
                    <div className="top">
                      <span className="av">C</span>
                      <div>
                        <h3>Business Analyst</h3>
                        <small>Company C · Coimbatore</small>
                      </div>
                    </div>
                    <dl>
                      <dt>Package</dt>
                      <dd className="num">5.0 LPA</dd>
                      <dt>Drive date</dt>
                      <dd>14 Oct</dd>
                      <dt>Rounds</dt>
                      <dd>Aptitude, Case study, HR</dd>
                    </dl>
                    <ul className="elig">
                      <li>
                        <Icon name="check" />
                        CGPA 7.5 or above · yours is 8.1
                      </li>
                      <li>
                        <Icon name="check" />
                        No active backlogs
                      </li>
                      <li>
                        <Icon name="check" />
                        Any UG degree
                      </li>
                    </ul>
                    <a className="btn btn-primary btn-sm" href="#l-rounds">
                      Apply
                    </a>
                  </article>
                  <article className="drive no" style={{ "--i": "2" }}>
                    <div className="top">
                      <span className="av">D</span>
                      <div>
                        <h3>Design Engineer</h3>
                        <small>Company D · Hosur</small>
                      </div>
                    </div>
                    <dl>
                      <dt>Package</dt>
                      <dd className="num">4.5 LPA</dd>
                      <dt>Drive date</dt>
                      <dd>21 Oct</dd>
                      <dt>Rounds</dt>
                      <dd>Technical, HR</dd>
                    </dl>
                    <ul className="elig">
                      <li>
                        <Icon name="check" />
                        CGPA 6.5 or above · yours is 8.1
                      </li>
                      <li className="x">
                        <Icon name="x" />
                        B.E. Mechanical only
                      </li>
                    </ul>
                    <span className="st mute" style={{ alignSelf: "flex-start", marginTop: "auto" }}>
                      Not eligible
                    </span>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="l-rounds">
          <div className="split flip">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Round tracker
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Know where you stand in every round
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Results are updated as each round closes. No more waiting outside the placement office.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#l-report">
                Next: assessment report
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-mint)" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>My applications</b>
                      <br />
                      <small>Sample data</small>
                    </div>
                    <span className="st info">3 active</span>
                  </div>
                  <div className="apps rows">
                    <div className="app" style={{ "--r": "0" }}>
                      <div>
                        <b>Company A · Graduate Trainee</b>
                        <small>Technical interview today</small>
                      </div>
                      <div>
                        <div className="steps5">
                          <span className="d"></span>
                          <span className="d"></span>
                          <span className="n"></span>
                          <span></span>
                          <span></span>
                        </div>
                        <div className="steps5-l">
                          <span>Applied</span>
                          <span>Aptitude</span>
                          <span>Technical</span>
                          <span>HR</span>
                          <span>Offer</span>
                        </div>
                      </div>
                      <span className="st info">In progress</span>
                    </div>
                    <div className="app" style={{ "--r": "1" }}>
                      <div>
                        <b>Company E · Sales Associate</b>
                        <small>Selected on 18 Sep</small>
                      </div>
                      <div>
                        <div className="steps5">
                          <span className="d"></span>
                          <span className="d"></span>
                          <span className="d"></span>
                          <span className="d"></span>
                          <span className="d"></span>
                        </div>
                        <div className="steps5-l">
                          <span>Applied</span>
                          <span>Aptitude</span>
                          <span>Group talk</span>
                          <span>HR</span>
                          <span>Offer</span>
                        </div>
                      </div>
                      <span className="st ok">Selected</span>
                    </div>
                    <div className="app" style={{ "--r": "2" }}>
                      <div>
                        <b>Company F · Data Associate</b>
                        <small>Aptitude on 10 Sep</small>
                      </div>
                      <div>
                        <div className="steps5">
                          <span className="d"></span>
                          <span className="x"></span>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <div className="steps5-l">
                          <span>Applied</span>
                          <span>Aptitude</span>
                          <span>Technical</span>
                          <span>HR</span>
                          <span>Offer</span>
                        </div>
                      </div>
                      <span className="st mute">Not cleared</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="l-report">
          <div className="split">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Assessment report
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Your scores, section by section
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                After every aptitude test you get a clear report against the cut-off, and the section to focus on next.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#l-offer">
                Next: offer letter
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-sky)" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>Aptitude report · Company A drive</b>
                      <br />
                      <small>Taken 24 Sep · Sample data</small>
                    </div>
                    <span className="st ok">Cleared cut-off</span>
                  </div>
                  <div className="report">
                    <div className="gauge">
                      <svg viewBox="0 0 150 150" aria-hidden="true">
                        <circle cx="75" cy="75" r="62" fill="none" stroke="var(--sage-2)" strokeWidth="12"></circle>
                        <circle
                          cx="75"
                          cy="75"
                          r="62"
                          fill="none"
                          stroke="var(--action)"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray="389.6"
                          strokeDashoffset="101.3"
                          transform="rotate(-90 75 75)"
                        ></circle>
                        <text
                          x="75"
                          y="82"
                          textAnchor="middle"
                          fontFamily="Bricolage Grotesque, Figtree, sans-serif"
                          fontSize="34"
                          fontWeight="600"
                          fill="var(--ink)"
                        >
                          74
                        </text>
                        <text
                          x="75"
                          y="102"
                          textAnchor="middle"
                          fontSize="11"
                          fill="var(--ink-3)"
                          fontFamily="Figtree, sans-serif"
                        >
                          out of 100
                        </text>
                      </svg>
                      <small>Cut-off: 60</small>
                    </div>
                    <div className="bars">
                      <div className="meter">
                        <div className="row">
                          <span>Quantitative aptitude</span>
                          <b className="num">82</b>
                        </div>
                        <div className="track">
                          <i style={{ "--w": "82%" }}></i>
                        </div>
                      </div>
                      <div className="meter">
                        <div className="row">
                          <span>Logical reasoning</span>
                          <b className="num">76</b>
                        </div>
                        <div className="track">
                          <i style={{ "--w": "76%" }}></i>
                        </div>
                      </div>
                      <div className="meter">
                        <div className="row">
                          <span>Verbal ability</span>
                          <b className="num">61</b>
                        </div>
                        <div className="track gold">
                          <i style={{ "--w": "61%" }}></i>
                        </div>
                      </div>
                      <div className="meter">
                        <div className="row">
                          <span>Technical basics</span>
                          <b className="num">77</b>
                        </div>
                        <div className="track">
                          <i style={{ "--w": "77%" }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="focus">
                    <Icon name="target" />
                    <span>
                      <b>Focus area: Verbal ability.</b> It&apos;s your lowest section and the closest to the cut-off.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="l-offer">
          <div className="split flip">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Offer letter
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Upload once, keep it safe
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Upload your letter against the drive you were selected in. The placement cell verifies it, and you can find it any
                time.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#l-how">
                See how it works
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-sand)" }}></div>
              <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/closing.jpg')" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>Company E · Sales Associate</b>
                      <br />
                      <small>Selected 18 Sep · Sample data</small>
                    </div>
                    <span className="st ok">Verified</span>
                  </div>
                  <div className="pad" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div className="file">
                      <span className="pdf">PDF</span>
                      <div className="t">
                        <b>Offer_Letter_CompanyE.pdf</b>
                        <small>Uploaded 19 Sep · 212 KB</small>
                      </div>
                      <span className="st ok">Verified by placement cell</span>
                    </div>
                    <div className="upload">
                      <Icon name="upload" />
                      <b style={{ color: "var(--ink)" }}>Joining letter</b>
                      <span>Add it here when you receive it</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rule"></div>

      <div className="row" id="l-how">
        <div className="head split2">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <span className="eb rv">
              <i></i>How it works
            </span>
            <Split as="h2" className="dt h2 anim">
              From login to offer letter in four steps
            </Split>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="steps4">
          <div className="st4" style={{ "--i": "0" }}>
            <span className="big">01</span>
            <h3>Get your login</h3>
            <p>Your placement cell adds your batch.</p>
            <div className="card-s">
              <div className="mini-row">
                <span>Batch 2026–27</span>
                <span className="st ok">Added</span>
              </div>
            </div>
          </div>
          <div className="st4" style={{ "--i": "1" }}>
            <span className="big">02</span>
            <h3>Complete your profile</h3>
            <p>Academics, backlogs and skills in one place.</p>
            <div className="card-s">
              <div className="mini-row">
                <span>Profile</span>
                <span className="st info">86%</span>
              </div>
            </div>
          </div>
          <div className="st4" style={{ "--i": "2" }}>
            <span className="big">03</span>
            <h3>Apply in a tap</h3>
            <p>Only to drives you are eligible for.</p>
            <div className="card-s">
              <div className="mini-row">
                <span>Company B</span>
                <span className="st ok">Applied</span>
              </div>
            </div>
          </div>
          <div className="st4" style={{ "--i": "3" }}>
            <span className="big">04</span>
            <h3>Track and upload</h3>
            <p>Follow every round, then upload your offer.</p>
            <div className="card-s">
              <div className="mini-row">
                <span>Company E</span>
                <span className="st ok">Selected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row drop" id="l-skill">
        <div className="head split2">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <span className="eb rv">
              <i></i>Four-year Skill Report · In development
            </span>
            <Split as="h2" className="dt h2 anim">
              Build your profile from first year
            </Split>
          </div>
          <p className="lede rv">
            Training, courses, hackathons, projects, internships and certifications, recorded as you go and verified by your
            college.
          </p>
        </div>
        <div style={{ paddingBottom: "72px" }}>
          <div className="years tl">
            <div className="yr f" style={{ "--i": "0" }}>
              <h3>First year</h3>
              <ul>
                <li>
                  <Icon name="star" />
                  Communication skills workshop
                </li>
                <li>
                  <Icon name="star" />
                  Python basics certificate
                </li>
              </ul>
            </div>
            <div className="yr f" style={{ "--i": "1" }}>
              <h3>Second year</h3>
              <ul>
                <li>
                  <Icon name="star" />
                  College hackathon, second place
                </li>
                <li>
                  <Icon name="star" />
                  Aptitude training, 40 hours
                </li>
              </ul>
            </div>
            <div className="yr f now" style={{ "--i": "2" }}>
              <h3>Third year</h3>
              <ul>
                <li>
                  <Icon name="star" />
                  Summer internship, 6 weeks
                </li>
                <li>
                  <Icon name="star" />
                  Mini project: library app
                </li>
              </ul>
            </div>
            <div className="yr" style={{ "--i": "3" }}>
              <h3>Final year</h3>
              <ul>
                <li>
                  <Icon name="star" />
                  Placement drives and results
                </li>
                <li>
                  <Icon name="star" />
                  Final project
                </li>
              </ul>
            </div>
            <div className="seal" style={{ "--i": "4" }}>
              <span>
                <Icon name="seal" />
                VERIFIED
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="l-faq">
        <div className="faq2">
          <div>
            <span className="eb rv">
              <i></i>FAQ
            </span>
            <Split as="h2" className="dt h2 anim" style={{ marginTop: "18px" }}>
              What students ask first
            </Split>
          </div>
          <div>
            <div className="faq rv">
              <details className="rv">
                <summary>
                  How do I get access?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">
                  Your college&apos;s placement cell sets up TalentSnaps and adds your batch. You&apos;ll get your login from
                  them.
                </p>
              </details>
              <details className="rv" style={{ "--i": "1" }}>
                <summary>
                  Why can&apos;t I apply to some drives?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">
                  Each company sets eligibility rules such as CGPA, backlogs and department. The drive card shows which rule you
                  don&apos;t meet.
                </p>
              </details>
              <details className="rv" style={{ "--i": "2" }}>
                <summary>
                  Can I use it on my phone?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">Yes. Drives, round results, reports and uploads all work on a phone.</p>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="l-cta">
        <div className="cta2">
          <div className="txt">
            <span className="eb rv">
              <i></i>Get started
            </span>
            <Split as="h2" className="dt h2 anim">
              Start your placement journey
            </Split>
            <p className="lede rv" style={{ "--i": "2" }}>
              TalentSnaps is set up by your college. Ask your training and placement cell to add your batch.
            </p>
            <div className="ctas rv" style={{ "--i": "3", justifyContent: "flex-start" }}>
              <a className="btn btn-blue" href="#l-drives">
                See what students get
                <Icon name="arrow" />
              </a>
              <a className="btn btn-line" href="#l-skill">
                The Skill Report
              </a>
            </div>
          </div>
          <div className="cell pan anim">
            <div className="pan-bg" style={{ "--pc": "var(--p-sand)" }}></div>
            <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/closing.jpg')" }}></div>
          </div>
        </div>
      </div>
    </>
  );
}
