import { Icon, MoreArrow, Split, TrendChart } from "./primitives";

// Institutions landing (/for-institutions): running a placement season end to end.
// Every product preview shows sample data and says so.
export function InstitutionsLanding() {
  return (
    <>
      <div className="row">
        <div className="hero">
          <span className="eb rv">
            <i></i>For training and placement cells
          </span>
          <Split as="h1" className="dt h1 anim">
            Run your whole placement season from one place
          </Split>
          <p className="lede rv" style={{ "--i": "2" }}>
            Announce drives, collect applications, run screening, track selections and close every placement with an offer letter,
            with numbers ready for NIRF.
          </p>
          <div className="ctas rv" style={{ "--i": "3" }}>
            <a className="btn btn-dark" href="#i-cta">
              Book a demo
              <Icon name="arrow" />
            </a>
            <a className="btn btn-line" href="#i-path">
              See the placement path
            </a>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" style={{ paddingInline: "var(--gut)" }}>
        <div className="show anim" role="img" aria-label="Placement cell dashboard preview with sample data">
          <div className="pan-bg" style={{ "--pc": "var(--p-mint)" }}></div>
          <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/hero.jpg')" }}></div>
          <div className="show-ui">
            <div className="win in-win" aria-label="Placement cell dashboard preview with sample data">
              <div className="bar">
                <i></i>
                <i></i>
                <i></i>
                <span>talentsnaps.app/placement-cell/season-2026-27</span>
                <em className="tag">Sample data</em>
              </div>
              <div className="in-body">
                <aside className="side">
                  <span className="on">
                    <Icon name="chart" />
                    Season
                  </span>
                  <span>
                    <Icon name="megaphone" />
                    Drives
                  </span>
                  <span>
                    <Icon name="users" />
                    Students
                  </span>
                  <span>
                    <Icon name="building" />
                    Departments
                  </span>
                  <span>
                    <Icon name="seal" />
                    Offer letters
                  </span>
                  <span>
                    <Icon name="download" />
                    NIRF reports
                  </span>
                </aside>
                <div className="in-main">
                  <div className="in-head">
                    <div>
                      <h3>Placement season 2026–27</h3>
                      <p>Training & Placement Cell · 11 departments</p>
                    </div>
                    <span className="st info">42 drives so far</span>
                  </div>
                  <div className="kpis rows">
                    <div className="kpi" style={{ "--r": "0" }}>
                      <small>Eligible students</small>
                      <b className="num">1,480</b>
                      <em>Final year</em>
                    </div>
                    <div className="kpi" style={{ "--r": "1" }}>
                      <small>Students placed</small>
                      <b className="num">386</b>
                      <em>26% of eligible</em>
                    </div>
                    <div className="kpi" style={{ "--r": "2" }}>
                      <small>Offer letters in</small>
                      <b className="num">71%</b>
                      <em>112 pending</em>
                    </div>
                    <div className="kpi" style={{ "--r": "3" }}>
                      <small>Median package</small>
                      <b className="num">3.9 LPA</b>
                      <em>Across all offers</em>
                    </div>
                  </div>
                  <div className="in-grid">
                    <div className="pn">
                      <h4>
                        Placed by department <small>% of eligible</small>
                      </h4>
                      <div className="hbar">
                        <span>Computer Science</span>
                        <div className="track">
                          <i style={{ "--w": "41%" }}></i>
                        </div>
                        <b className="num">41%</b>
                      </div>
                      <div className="hbar">
                        <span>Electronics</span>
                        <div className="track">
                          <i style={{ "--w": "33%" }}></i>
                        </div>
                        <b className="num">33%</b>
                      </div>
                      <div className="hbar">
                        <span>Management</span>
                        <div className="track">
                          <i style={{ "--w": "28%" }}></i>
                        </div>
                        <b className="num">28%</b>
                      </div>
                      <div className="hbar">
                        <span>Commerce</span>
                        <div className="track">
                          <i style={{ "--w": "19%" }}></i>
                        </div>
                        <b className="num">19%</b>
                      </div>
                      <div className="hbar">
                        <span>Arts & Science</span>
                        <div className="track">
                          <i style={{ "--w": "14%" }}></i>
                        </div>
                        <b className="num">14%</b>
                      </div>
                    </div>
                    <div className="pn">
                      <h4>
                        Students placed by month <small>cumulative</small>
                      </h4>
                      <TrendChart />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row">
        <div className="mq-row-wrap" aria-label="Everything your placement cell runs today">
          <span className="eb">
            <i></i>Everything your placement cell runs today
          </span>
          <div className="mq-mask">
            <div className="mq" aria-hidden="true">
              <div className="mq-seq">
                <span>Drive announcements</span>
                <span>Eligibility</span>
                <span>Applications</span>
                <span>Two-level screening</span>
                <span>Aptitude tests</span>
                <span>Selections</span>
                <span>Offer letters</span>
                <span>NIRF reports</span>
                <span>Accreditation data</span>
              </div>
              <div className="mq-seq">
                <span>Drive announcements</span>
                <span>Eligibility</span>
                <span>Applications</span>
                <span>Two-level screening</span>
                <span>Aptitude tests</span>
                <span>Selections</span>
                <span>Offer letters</span>
                <span>NIRF reports</span>
                <span>Accreditation data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="i-features">
        <div className="head split2">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <span className="eb rv">
              <i></i>What you get
            </span>
            <Split as="h2" className="dt h2 anim">
              Your whole season in one system
            </Split>
          </div>
          <p className="lede rv" style={{ "--i": "2" }}>
            Instead of a WhatsApp group, a spreadsheet and a folder of PDFs.
          </p>
        </div>
      </div>
      <div className="rule"></div>

      <div className="row">
        <div className="cells">
          <article className="cl w2 rv" style={{ "--i": "0" }}>
            <span className="k">01 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-mint)" }}>
              <div className="vis-in">
                <div className="reach" style={{ margin: "0" }}>
                  <Icon name="bell" />
                  <span>
                    Will notify <b className="num">612</b> eligible students out of 1,480
                  </span>
                </div>
                <div className="chips">
                  <span className="chipx on">CGPA ≥ 7.5</span>
                  <span className="chipx on">No backlogs</span>
                  <span className="chipx on">Batch 2026–27</span>
                </div>
              </div>
            </div>
            <h3>Reach exactly who qualifies</h3>
            <p>Eligibility worked out from each student’s record.</p>
          </article>
          <article className="cl rv" style={{ "--i": "1" }}>
            <span className="k">02 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-blue)" }}>
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
                      strokeDashoffset="61.9"
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
                      71%
                    </text>
                  </svg>
                  <span style={{ color: "var(--ink-2)", maxWidth: "14ch" }}>Offer letters collected</span>
                </div>
              </div>
            </div>
            <h3>Offer letters collected</h3>
            <p>Every selection closed with proof.</p>
          </article>
          <article className="cl rv" style={{ "--i": "2" }}>
            <span className="k">03 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-sand)" }}>
              <div className="vis-in">
                <div className="mini-row">
                  <span>UG · 3 year</span>
                  <b className="num">402 placed</b>
                </div>
                <div className="mini-row">
                  <span>PG · 2 year</span>
                  <b className="num">96 placed</b>
                </div>
                <div className="mini-row">
                  <span>Median salary</span>
                  <b className="num">₹3,60,000</b>
                </div>
              </div>
            </div>
            <h3>NIRF-ready numbers</h3>
            <p>Straight from your records.</p>
          </article>
          <article className="cl rv" style={{ "--i": "0" }}>
            <span className="k">04 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-sky)" }}>
              <div className="vis-in">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
                  <div style={{ border: "1px solid var(--line)", borderRadius: "6px", padding: "8px", color: "var(--ink-2)" }}>
                    <div style={{ fontSize: "11px" }}>Applied</div>
                    <b className="num" style={{ color: "var(--ink)" }}>
                      212
                    </b>
                  </div>
                  <div style={{ border: "1px solid var(--line)", borderRadius: "6px", padding: "8px", color: "var(--ink-2)" }}>
                    <div style={{ fontSize: "11px" }}>Level 1</div>
                    <b className="num" style={{ color: "var(--ink)" }}>
                      148
                    </b>
                  </div>
                  <div style={{ border: "1px solid var(--line)", borderRadius: "6px", padding: "8px", color: "var(--ink-2)" }}>
                    <div style={{ fontSize: "11px" }}>Level 2</div>
                    <b className="num" style={{ color: "var(--ink)" }}>
                      64
                    </b>
                  </div>
                  <div style={{ border: "1px solid var(--line)", borderRadius: "6px", padding: "8px", color: "var(--ink-2)" }}>
                    <div style={{ fontSize: "11px" }}>Selected</div>
                    <b className="num" style={{ color: "var(--ink)" }}>
                      18
                    </b>
                  </div>
                </div>
              </div>
            </div>
            <h3>Company-wise boards</h3>
            <p>Every recruiter’s rounds, tracked separately.</p>
          </article>
          <article className="cl rv" style={{ "--i": "1" }}>
            <span className="k">05 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-mint)" }}>
              <div className="vis-in">
                <div className="bars2">
                  <i style={{ "--h": "41%" }}></i>
                  <i style={{ "--h": "33%" }}></i>
                  <i style={{ "--h": "28%" }}></i>
                  <i style={{ "--h": "19%" }}></i>
                  <i style={{ "--h": "14%" }}></i>
                </div>
              </div>
            </div>
            <h3>Department view</h3>
            <p>See which departments need attention.</p>
          </article>
        </div>
      </div>

      <div className="rule"></div>
      <div className="stack">
        <div className="row stk" id="i-announce">
          <div className="split">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Announcements
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Reach exactly the students who qualify
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Set the rules once and TalentSnaps works out who is eligible from each student’s record.
              </p>
              <ul className="ticks rv" style={{ "--i": "3" }}>
                <li>
                  <Icon name="check" />
                  No manual shortlists by department
                </li>
                <li>
                  <Icon name="check" />
                  Only eligible students are notified
                </li>
              </ul>
              <a className="more rv" style={{ "--i": "4" }} href="#i-boards">
                Next: company boards
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-mint)" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>Announce drive · Company C</b>
                      <br />
                      <small>Business Analyst · Sample data</small>
                    </div>
                    <span className="st mute">Draft</span>
                  </div>
                  <div className="announce">
                    <div className="form" style={{ padding: "0" }}>
                      <div className="fld">
                        <span>Drive date</span>
                        <div className="inp">14 Oct, 9:30 AM</div>
                      </div>
                      <div className="fld">
                        <span>Apply by</span>
                        <div className="inp">4 Oct</div>
                      </div>
                      <div className="fld full">
                        <span>Eligibility</span>
                        <div className="chips">
                          <span className="chipx on">Any UG degree</span>
                          <span className="chipx on">CGPA ≥ 7.5</span>
                          <span className="chipx on">No active backlogs</span>
                          <span className="chipx on">Batch 2026–27</span>
                        </div>
                      </div>
                    </div>
                    <div className="reach">
                      <Icon name="bell" style={{ color: "var(--forest)" }} />
                      <span>
                        Will notify <b className="num">612</b> eligible students out of 1,480
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="i-boards">
          <div className="split flip">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Company-wise recruitment
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Every company’s process, round by round
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Each recruiter runs different rounds. A separate board for each company shows where every student stands.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#i-offers">
                Next: offer letters
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-blue)" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>Company A · Graduate Engineer Trainee</b>
                      <br />
                      <small>Drive on 3 Oct · Sample data</small>
                    </div>
                    <span className="st info">Round 2 in progress</span>
                  </div>
                  <div className="board rows">
                    <div className="col" style={{ "--r": "0" }}>
                      <div className="col-h">
                        <span>Applied</span>
                        <span className="num">212</span>
                      </div>
                      <div className="card">
                        <b>Priya S.</b>
                        <div className="meta">
                          <span>B.Sc CS · 8.4</span>
                          <span className="st ok">Eligible</span>
                        </div>
                      </div>
                      <div className="card">
                        <b>Arun K.</b>
                        <div className="meta">
                          <span>BCA · 7.9</span>
                          <span className="st ok">Eligible</span>
                        </div>
                      </div>
                    </div>
                    <div className="col" style={{ "--r": "1" }}>
                      <div className="col-h">
                        <span>Level 1</span>
                        <span className="num">148</span>
                      </div>
                      <div className="card">
                        <b>Meera R.</b>
                        <div className="meta">
                          <span>Aptitude 74</span>
                          <span className="st ok">Cleared</span>
                        </div>
                      </div>
                      <div className="card">
                        <b>Dinesh P.</b>
                        <div className="meta">
                          <span>Aptitude 58</span>
                          <span className="st warn">Waitlist</span>
                        </div>
                      </div>
                    </div>
                    <div className="col" style={{ "--r": "2" }}>
                      <div className="col-h">
                        <span>Level 2</span>
                        <span className="num">64</span>
                      </div>
                      <div className="card">
                        <b>Kavya M.</b>
                        <div className="meta">
                          <span>Technical</span>
                          <span className="st info">Today</span>
                        </div>
                      </div>
                      <div className="card">
                        <b>Rahul V.</b>
                        <div className="meta">
                          <span>Technical</span>
                          <span className="st info">Today</span>
                        </div>
                      </div>
                    </div>
                    <div className="col" style={{ "--r": "3" }}>
                      <div className="col-h">
                        <span>Selected</span>
                        <span className="num">18</span>
                      </div>
                      <div className="card">
                        <b>Sneha J.</b>
                        <div className="meta">
                          <span>Offer letter</span>
                          <span className="st ok">Received</span>
                        </div>
                      </div>
                      <div className="card">
                        <b>Vignesh T.</b>
                        <div className="meta">
                          <span>Offer letter</span>
                          <span className="st warn">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="i-offers">
          <div className="split">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Offer letters
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Close every selection with proof
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Students upload their letter against the drive they were selected in. You see who is pending and verify each one.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#i-nirf">
                Next: NIRF report
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-sand)" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>Offer letters · Batch 2026</b>
                      <br />
                      <small>Sample data</small>
                    </div>
                    <span className="st ok">71% collected</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Company</th>
                          <th>Role</th>
                          <th className="r">LPA</th>
                          <th>Letter</th>
                        </tr>
                      </thead>
                      <tbody className="rows">
                        <tr style={{ "--r": "0" }}>
                          <td>Sneha J.</td>
                          <td>Company A</td>
                          <td>Graduate Trainee</td>
                          <td className="r num">4.2</td>
                          <td>
                            <span className="st ok">Verified</span>
                          </td>
                        </tr>
                        <tr style={{ "--r": "1" }}>
                          <td>Harish N.</td>
                          <td>Company D</td>
                          <td>Associate Analyst</td>
                          <td className="r num">3.6</td>
                          <td>
                            <span className="st ok">Verified</span>
                          </td>
                        </tr>
                        <tr style={{ "--r": "2" }}>
                          <td>Fathima Z.</td>
                          <td>Company B</td>
                          <td>Support Engineer</td>
                          <td className="r num">3.8</td>
                          <td>
                            <span className="st info">Uploaded</span>
                          </td>
                        </tr>
                        <tr style={{ "--r": "3" }}>
                          <td>Vignesh T.</td>
                          <td>Company A</td>
                          <td>Graduate Trainee</td>
                          <td className="r num">4.2</td>
                          <td>
                            <span className="st warn">Pending</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="i-nirf">
          <div className="split flip">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>NIRF and accreditation
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Numbers ready when the report is due
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Every placement is linked to a drive, a package and an offer letter, so NIRF figures come straight from your
                records.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#i-path">
                See the placement path
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-sky)" }}></div>
              <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/closing.jpg')" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>NIRF placement summary · 2025–26</b>
                      <br />
                      <small>Sample data</small>
                    </div>
                    <span className="st ok">Ready to export</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Programme</th>
                          <th className="r">Graduating</th>
                          <th className="r">Placed</th>
                          <th className="r">Median salary (₹)</th>
                          <th className="r">Higher studies</th>
                        </tr>
                      </thead>
                      <tbody className="rows">
                        <tr style={{ "--r": "0" }}>
                          <td>UG · 3 year</td>
                          <td className="r num">1,120</td>
                          <td className="r num">402</td>
                          <td className="r num">3,60,000</td>
                          <td className="r num">214</td>
                        </tr>
                        <tr style={{ "--r": "1" }}>
                          <td>UG · 4 year</td>
                          <td className="r num">240</td>
                          <td className="r num">151</td>
                          <td className="r num">4,20,000</td>
                          <td className="r num">31</td>
                        </tr>
                        <tr style={{ "--r": "2" }}>
                          <td>PG · 2 year</td>
                          <td className="r num">180</td>
                          <td className="r num">96</td>
                          <td className="r num">4,80,000</td>
                          <td className="r num">12</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="foot">
                    <span>Every figure links back to offer letters</span>
                    <span className="btn btn-quiet btn-xs">
                      <Icon name="download" />
                      Export report
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rule"></div>

      <div className="row" id="i-path">
        <div className="head split2">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <span className="eb rv">
              <i></i>The placement path
            </span>
            <Split as="h2" className="dt h2 anim">
              One path from announcement to offer letter
            </Split>
          </div>
        </div>
      </div>

      <div className="row">
        <div style={{ padding: "8px clamp(20px,4vw,48px) 72px" }}>
          <div className="path" id="path">
            <svg className="line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
              <path d="M34 0 C 130 0, 150 50, 234 50 S 340 0, 434 0 S 540 50, 634 50 S 740 0, 834 0"></path>
              <path className="draw" d="M34 0 C 130 0, 150 50, 234 50 S 340 0, 434 0 S 540 50, 634 50 S 740 0, 834 0"></path>
            </svg>
            <ol className="steps">
              <li className="step rv">
                <div className="node">
                  <Icon name="megaphone" />
                </div>
                <div>
                  <span className="k">STEP 1</span>
                  <h3>Announce drives</h3>
                  <p>Publish drives with eligibility rules. Only eligible students are notified.</p>
                </div>
              </li>
              <li className="step rv" style={{ "--i": "1" }}>
                <div className="node">
                  <Icon name="files" />
                </div>
                <div>
                  <span className="k">STEP 2</span>
                  <h3>Collect applications</h3>
                  <p>Applications arrive complete and in one format.</p>
                </div>
              </li>
              <li className="step rv" style={{ "--i": "2" }}>
                <div className="node">
                  <Icon name="funnel" />
                </div>
                <div>
                  <span className="k">STEP 3</span>
                  <h3>Screen in two levels</h3>
                  <p>First and second-level screening per company, with aptitude built in.</p>
                </div>
              </li>
              <li className="step rv" style={{ "--i": "3" }}>
                <div className="node">
                  <Icon name="steps" />
                </div>
                <div>
                  <span className="k">STEP 4</span>
                  <h3>Track selections</h3>
                  <p>See who cleared which round, company by company.</p>
                </div>
              </li>
              <li className="step rv" style={{ "--i": "4" }}>
                <div className="node">
                  <Icon name="seal" />
                </div>
                <div>
                  <span className="k">STEP 5</span>
                  <h3>Collect offer letters</h3>
                  <p>Close every selection with proof, ready for audits and NIRF.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row">
        <div style={{ padding: "0 clamp(20px,4vw,48px) 40px" }}>
          <div className="facts">
            <div className="fact rv">
              <b className="num">2,000–5,000</b>
              <p>Students per college the system is designed to handle in one season.</p>
            </div>
            <div className="fact rv" style={{ "--i": "1" }}>
              <b className="num">2 levels</b>
              <p>Of screening per company, around the recruiter&apos;s own rounds.</p>
            </div>
            <div className="fact rv" style={{ "--i": "2" }}>
              <b>Every offer</b>
              <p>Linked to a drive, a role and an uploaded letter.</p>
            </div>
            <div className="fact rv" style={{ "--i": "3" }}>
              <b>Tier 2 & 3</b>
              <p>Colleges growing a structured placement cell are who it&apos;s built for first.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="i-faq">
        <div className="faq2">
          <div>
            <span className="eb rv">
              <i></i>FAQ
            </span>
            <Split as="h2" className="dt h2 anim" style={{ marginTop: "18px" }}>
              What placement cells ask first
            </Split>
          </div>
          <div>
            <div className="faq rv">
              <details className="rv">
                <summary>
                  Is TalentSnaps an aptitude test platform?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">
                  No. Aptitude assessment is built in, but it is one part. TalentSnaps runs the whole placement process, from
                  drive announcements to offer letter collection.
                </p>
              </details>
              <details className="rv" style={{ "--i": "1" }}>
                <summary>
                  How does offer letter collection work?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">
                  When a student is marked selected, they&apos;re asked to upload their offer letter against that drive. You see
                  who has uploaded and who is pending, and verify each letter.
                </p>
              </details>
              <details className="rv" style={{ "--i": "2" }}>
                <summary>
                  Does it help with NIRF and accreditation?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">
                  Yes. Placements, packages and offer letters are stored as structured records, so the numbers can be pulled from
                  the system instead of compiled by hand.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="i-cta">
        <div className="cta2">
          <div className="txt">
            <span className="eb rv">
              <i></i>Book a demo
            </span>
            <Split as="h2" className="dt h2 anim">
              Bring your placement cell onto one system
            </Split>
            <p className="lede rv" style={{ "--i": "2" }}>
              We walk through your current process and show TalentSnaps set up with your own departments and drives.
            </p>
            <div className="ctas rv" style={{ "--i": "3", justifyContent: "flex-start" }}>
              <a className="btn btn-blue" href="#i-announce">
                Book a demo
                <Icon name="arrow" />
              </a>
              <a className="btn btn-line" href="#i-path">
                See the placement path
              </a>
            </div>
          </div>
          <div className="cell pan anim">
            <div className="pan-bg" style={{ "--pc": "var(--p-sand)" }}></div>
            <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/hero.jpg')" }}></div>
          </div>
        </div>
      </div>
    </>
  );
}
