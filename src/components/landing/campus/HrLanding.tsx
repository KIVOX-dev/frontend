import { Icon, MoreArrow, Split } from "./primitives";

// HR landing (/for-hr): posting drives, screening applicants and sharing results.
// Every product preview shows sample data and says so.
export function HrLanding() {
  return (
    <>
      <div className="row">
        <div className="hero">
          <span className="eb rv">
            <i></i>For HR and campus hiring teams
          </span>
          <Split as="h1" className="dt h1 anim">
            Hire from campus with verified records
          </Split>
          <p className="lede rv" style={{ "--i": "2" }}>
            Post a drive once, receive only eligible applicants, screen them round by round and share results with every placement
            cell.
          </p>
          <div className="ctas rv" style={{ "--i": "3" }}>
            <a className="btn btn-dark" href="#h-cta">
              Book a demo
              <Icon name="arrow" />
            </a>
            <a className="btn btn-line" href="#h-post">
              See the workflow
            </a>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" style={{ paddingInline: "var(--gut)" }}>
        <div className="show anim" role="img" aria-label="Recruiter workspace preview with sample data">
          <div className="pan-bg" style={{ "--pc": "var(--p-sky)" }}></div>
          <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/hr.jpg')" }}></div>
          <div className="show-ui">
            <div className="win hr-win" aria-label="Recruiter workspace preview with sample data">
              <div className="bar">
                <i></i>
                <i></i>
                <i></i>
                <span>talentsnaps.app/recruiter/drives/graduate-trainee</span>
                <em className="tag">Sample data</em>
              </div>
              <div className="hr-body">
                <div className="pipe">
                  <div className="pipe-h">
                    <div>
                      <b>Graduate Engineer Trainee</b>
                      <br />
                      <small>Drive on 3 Oct · 6 partner colleges</small>
                    </div>
                    <span className="st info">Technical round open</span>
                  </div>
                  <div className="lane rows">
                    <div className="lane-h">
                      <span>Aptitude cleared</span>
                      <span className="num">148</span>
                    </div>
                    <div className="cc" style={{ "--r": "0" }}>
                      <b>Arun K.</b>
                      <small>BCA · College 2</small>
                      <div className="sc">
                        <span className="num">Apt 69</span>
                        <span className="st mute">Waiting</span>
                      </div>
                    </div>
                    <div className="cc" style={{ "--r": "1" }}>
                      <b>Divya S.</b>
                      <small>B.Sc CS · College 1</small>
                      <div className="sc">
                        <span className="num">Apt 72</span>
                        <span className="st mute">Waiting</span>
                      </div>
                    </div>
                    <div className="cc" style={{ "--r": "2" }}>
                      <b>Imran A.</b>
                      <small>B.E. ECE · College 4</small>
                      <div className="sc">
                        <span className="num">Apt 66</span>
                        <span className="st mute">Waiting</span>
                      </div>
                    </div>
                  </div>
                  <div className="lane rows">
                    <div className="lane-h">
                      <span>Technical</span>
                      <span className="num">64</span>
                    </div>
                    <div className="cc sel" style={{ "--r": "0" }}>
                      <b>Kavya M.</b>
                      <small>B.E. ECE · College 3</small>
                      <div className="sc">
                        <span className="num">Apt 81</span>
                        <span className="st info">Panel 2</span>
                      </div>
                    </div>
                    <div className="cc" style={{ "--r": "1" }}>
                      <b>Rahul V.</b>
                      <small>BCA · College 1</small>
                      <div className="sc">
                        <span className="num">Apt 72</span>
                        <span className="st info">Panel 1</span>
                      </div>
                    </div>
                  </div>
                  <div className="lane rows">
                    <div className="lane-h">
                      <span>HR interview</span>
                      <span className="num">26</span>
                    </div>
                    <div className="cc" style={{ "--r": "0" }}>
                      <b>Nisha P.</b>
                      <small>B.Sc IT · College 5</small>
                      <div className="sc">
                        <span className="num">Apt 78</span>
                        <span className="st warn">Tomorrow</span>
                      </div>
                    </div>
                    <div className="cc" style={{ "--r": "1" }}>
                      <b>Gokul R.</b>
                      <small>B.E. CSE · College 2</small>
                      <div className="sc">
                        <span className="num">Apt 84</span>
                        <span className="st warn">Tomorrow</span>
                      </div>
                    </div>
                  </div>
                  <div className="lane rows">
                    <div className="lane-h">
                      <span>Selected</span>
                      <span className="num">18</span>
                    </div>
                    <div className="cc" style={{ "--r": "0" }}>
                      <b>Sneha J.</b>
                      <small>B.Sc CS · College 1</small>
                      <div className="sc">
                        <span className="num">Apt 79</span>
                        <span className="st ok">Offer sent</span>
                      </div>
                    </div>
                  </div>
                </div>
                <aside className="cand">
                  <div className="cand-h">
                    <span className="av">KM</span>
                    <div>
                      <b>Kavya M.</b>
                      <small>B.E. ECE, final year · College 3</small>
                    </div>
                  </div>
                  <div className="facts2">
                    <div>
                      <small>CGPA</small>
                      <b className="num">8.6</b>
                    </div>
                    <div>
                      <small>Backlogs</small>
                      <b className="num">0</b>
                    </div>
                    <div>
                      <small>Aptitude</small>
                      <b className="num">81</b>
                    </div>
                  </div>
                  <div className="meter">
                    <div className="row">
                      <span>Quantitative</span>
                      <b className="num">86</b>
                    </div>
                    <div className="track">
                      <i style={{ "--w": "86%" }}></i>
                    </div>
                  </div>
                  <div className="meter">
                    <div className="row">
                      <span>Logical reasoning</span>
                      <b className="num">80</b>
                    </div>
                    <div className="track">
                      <i style={{ "--w": "80%" }}></i>
                    </div>
                  </div>
                  <div className="meter">
                    <div className="row">
                      <span>Verbal ability</span>
                      <b className="num">74</b>
                    </div>
                    <div className="track">
                      <i style={{ "--w": "74%" }}></i>
                    </div>
                  </div>
                  <div className="hist">
                    <div>
                      <span>Applied</span>
                      <span className="st ok">12 Sep</span>
                    </div>
                    <div>
                      <span>Aptitude</span>
                      <span className="st ok">Cleared</span>
                    </div>
                    <div>
                      <span>Technical</span>
                      <span className="st info">Today, Panel 2</span>
                    </div>
                  </div>
                  <div className="acts">
                    <span className="btn btn-primary btn-xs">Move to HR round</span>
                    <span className="btn btn-quiet btn-xs">Hold</span>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row">
        <div className="mq-row-wrap" aria-label="One workspace for every campus drive">
          <span className="eb">
            <i></i>One workspace for every campus drive
          </span>
          <div className="mq-mask">
            <div className="mq" aria-hidden="true">
              <div className="mq-seq">
                <span>Partner colleges</span>
                <span>Eligibility rules</span>
                <span>Aptitude scores</span>
                <span>CGPA and backlogs</span>
                <span>Technical rounds</span>
                <span>HR interviews</span>
                <span>Shortlists</span>
                <span>Offer status</span>
              </div>
              <div className="mq-seq">
                <span>Partner colleges</span>
                <span>Eligibility rules</span>
                <span>Aptitude scores</span>
                <span>CGPA and backlogs</span>
                <span>Technical rounds</span>
                <span>HR interviews</span>
                <span>Shortlists</span>
                <span>Offer status</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="h-features">
        <div className="head split2">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <span className="eb rv">
              <i></i>What you get
            </span>
            <Split as="h2" className="dt h2 anim">
              Campus hiring without the spreadsheets
            </Split>
          </div>
          <p className="lede rv" style={{ "--i": "2" }}>
            Every applicant arrives in one format, whichever college they come from.
          </p>
        </div>
      </div>
      <div className="rule"></div>

      <div className="row">
        <div className="cells">
          <article className="cl w2 rv" style={{ "--i": "0" }}>
            <span className="k">01 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-sky)" }}>
              <div className="vis-in">
                <div className="chips">
                  <span className="chipx on">College 1</span>
                  <span className="chipx on">College 2</span>
                  <span className="chipx on">College 3</span>
                  <span className="chipx on">College 4</span>
                  <span className="chipx on">College 5</span>
                  <span className="chipx">+ Add</span>
                </div>
                <div className="mini-row">
                  <span>Graduate Engineer Trainee</span>
                  <span className="st info">6 colleges</span>
                </div>
              </div>
            </div>
            <h3>Post once, reach many colleges</h3>
            <p>One drive with your rules, sent to every partner college.</p>
          </article>
          <article className="cl rv" style={{ "--i": "1" }}>
            <span className="k">02 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-blue)" }}>
              <div className="vis-in">
                <div className="chips">
                  <span className="chipx on">CGPA ≥ 7.0</span>
                  <span className="chipx on">Aptitude ≥ 60</span>
                  <span className="chipx on">No backlogs</span>
                </div>
                <div className="mini-row">
                  <span>Matching</span>
                  <b className="num">148 of 212</b>
                </div>
              </div>
            </div>
            <h3>Only eligible applicants</h3>
            <p>Rules applied to every student record.</p>
          </article>
          <article className="cl rv" style={{ "--i": "2" }}>
            <span className="k">03 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-mint)" }}>
              <div className="vis-in">
                <div className="bars2">
                  <i style={{ "--h": "86%" }}></i>
                  <i style={{ "--h": "80%" }}></i>
                  <i style={{ "--h": "74%" }}></i>
                  <i style={{ "--h": "69%" }}></i>
                  <i style={{ "--h": "62%" }}></i>
                  <i style={{ "--h": "58%" }}></i>
                </div>
              </div>
            </div>
            <h3>Comparable scores</h3>
            <p>Everyone takes the same aptitude round.</p>
          </article>
          <article className="cl rv" style={{ "--i": "0" }}>
            <span className="k">04 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-sand)" }}>
              <div className="vis-in">
                <div className="fn" style={{ gridTemplateColumns: "70px 1fr 34px" }}>
                  <span>Applied</span>
                  <div className="bb">
                    <i style={{ "--w": "100%", transform: "none" }}></i>
                  </div>
                  <b>212</b>
                </div>
                <div className="fn" style={{ gridTemplateColumns: "70px 1fr 34px" }}>
                  <span>Technical</span>
                  <div className="bb">
                    <i style={{ "--w": "30%", transform: "none" }}></i>
                  </div>
                  <b>64</b>
                </div>
                <div className="fn" style={{ gridTemplateColumns: "70px 1fr 34px" }}>
                  <span>Selected</span>
                  <div className="bb">
                    <i style={{ "--w": "8.5%", transform: "none" }}></i>
                  </div>
                  <b>18</b>
                </div>
              </div>
            </div>
            <h3>Round-by-round funnel</h3>
            <p>See where every candidate stands.</p>
          </article>
          <article className="cl rv" style={{ "--i": "1" }}>
            <span className="k">05 / 05</span>
            <div className="vis" style={{ "--pc": "var(--p-sky)" }}>
              <div className="vis-in">
                <div className="mini-row">
                  <span>College 1 · 6 selected</span>
                  <span className="st ok">Seen</span>
                </div>
                <div className="mini-row">
                  <span>College 3 · 5 selected</span>
                  <span className="st info">Delivered</span>
                </div>
              </div>
            </div>
            <h3>Results to colleges</h3>
            <p>Shortlists reach every placement cell at once.</p>
          </article>
        </div>
      </div>

      <div className="rule"></div>
      <div className="stack">
        <div className="row stk" id="h-post">
          <div className="split">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Post a drive
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Set the role, rules and rounds once
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Your eligibility rules are applied to every student record at the partner colleges you choose. Only students who
                qualify can apply.
              </p>
              <ul className="ticks rv" style={{ "--i": "3" }}>
                <li>
                  <Icon name="check" />
                  Department, CGPA and backlog rules
                </li>
                <li>
                  <Icon name="check" />
                  Your own sequence of rounds
                </li>
              </ul>
              <a className="more rv" style={{ "--i": "4" }} href="#h-applicants">
                Next: applicants
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-sky)" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>New drive</b>
                      <br />
                      <small>Sample data</small>
                    </div>
                    <span className="st mute">Draft</span>
                  </div>
                  <div className="form">
                    <div className="fld">
                      <span>Role</span>
                      <div className="inp">Graduate Engineer Trainee</div>
                    </div>
                    <div className="fld">
                      <span>Package</span>
                      <div className="inp num">4.2 LPA</div>
                    </div>
                    <div className="fld full">
                      <span>Eligible departments</span>
                      <div className="chips">
                        <span className="chipx on">B.E. CSE</span>
                        <span className="chipx on">B.E. ECE</span>
                        <span className="chipx on">B.Sc CS</span>
                        <span className="chipx on">BCA</span>
                        <span className="chipx">B.Com</span>
                        <span className="chipx">MBA</span>
                      </div>
                    </div>
                    <div className="fld">
                      <span>Minimum CGPA</span>
                      <div className="inp num">7.0</div>
                    </div>
                    <div className="fld">
                      <span>Active backlogs</span>
                      <div className="inp">Not allowed</div>
                    </div>
                    <div className="fld full">
                      <span>Rounds</span>
                      <div className="roundlist">
                        <div>
                          <Icon name="grip" className="grip" />
                          Aptitude test<em>Online · cut-off 60</em>
                        </div>
                        <div>
                          <Icon name="grip" className="grip" />
                          Technical interview<em>On campus</em>
                        </div>
                        <div>
                          <Icon name="grip" className="grip" />
                          HR interview<em>On campus</em>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="foot">
                    <span>Sends to 6 partner colleges</span>
                    <span className="btn btn-primary btn-sm">
                      <Icon name="send" />
                      Publish drive
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="h-applicants">
          <div className="split flip">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Applicants
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Every applicant arrives complete
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Academics, backlogs and assessment scores in one format. Filter and sort without asking for another spreadsheet.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#h-rounds">
                Next: screening
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-blue)" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="filters">
                    <span>Filters</span>
                    <span className="chipx on">CGPA ≥ 7.0</span>
                    <span className="chipx on">Aptitude ≥ 60</span>
                    <span className="chipx on">No backlogs</span>
                    <span className="chipx">All colleges</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>College</th>
                          <th>Degree</th>
                          <th className="r">CGPA</th>
                          <th className="r">Aptitude</th>
                        </tr>
                      </thead>
                      <tbody className="rows">
                        <tr style={{ "--r": "0" }}>
                          <td>Gokul R.</td>
                          <td>College 2</td>
                          <td>B.E. CSE</td>
                          <td className="r num">8.9</td>
                          <td className="r num">84</td>
                        </tr>
                        <tr style={{ "--r": "1" }}>
                          <td>Kavya M.</td>
                          <td>College 3</td>
                          <td>B.E. ECE</td>
                          <td className="r num">8.6</td>
                          <td className="r num">81</td>
                        </tr>
                        <tr style={{ "--r": "2" }}>
                          <td>Sneha J.</td>
                          <td>College 1</td>
                          <td>B.Sc CS</td>
                          <td className="r num">8.4</td>
                          <td className="r num">79</td>
                        </tr>
                        <tr style={{ "--r": "3" }}>
                          <td>Nisha P.</td>
                          <td>College 5</td>
                          <td>B.Sc IT</td>
                          <td className="r num">8.1</td>
                          <td className="r num">78</td>
                        </tr>
                        <tr style={{ "--r": "4" }}>
                          <td>Divya S.</td>
                          <td>College 1</td>
                          <td>B.Sc CS</td>
                          <td className="r num">7.8</td>
                          <td className="r num">72</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="foot">
                    <span>Showing 5 of 148 · Sample data</span>
                    <span className="btn btn-quiet btn-xs">
                      <Icon name="download" />
                      Export
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="h-rounds">
          <div className="split">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Screening
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                See the whole funnel, round by round
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Move candidates between rounds as results come in. The numbers update for you and the placement cell together.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#h-results">
                Next: share results
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-mint)" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>Graduate Engineer Trainee · funnel</b>
                      <br />
                      <small>Sample data</small>
                    </div>
                    <span className="st info">Round 3 of 4</span>
                  </div>
                  <div className="funnel">
                    <div className="fn">
                      <span>Applied</span>
                      <div className="bb">
                        <i style={{ "--w": "100%" }}></i>
                      </div>
                      <b className="num">212</b>
                    </div>
                    <div className="fn">
                      <span>Aptitude cleared</span>
                      <div className="bb">
                        <i style={{ "--w": "69.8%" }}></i>
                      </div>
                      <b className="num">148</b>
                    </div>
                    <div className="fn">
                      <span>Technical</span>
                      <div className="bb">
                        <i style={{ "--w": "30.2%" }}></i>
                      </div>
                      <b className="num">64</b>
                    </div>
                    <div className="fn">
                      <span>HR interview</span>
                      <div className="bb">
                        <i style={{ "--w": "12.3%" }}></i>
                      </div>
                      <b className="num">26</b>
                    </div>
                    <div className="fn">
                      <span>Selected</span>
                      <div className="bb">
                        <i style={{ "--w": "8.5%" }}></i>
                      </div>
                      <b className="num">18</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row stk" id="h-results">
          <div className="split flip">
            <div className="cell txt">
              <span className="eb rv">
                <i></i>Results
              </span>
              <Split as="h2" className="dt h3 anim" slash>
                Share results with every college at once
              </Split>
              <p className="body rv" style={{ "--i": "2" }}>
                Shortlists and selections go straight to each placement cell, and students see their own status.
              </p>
              <a className="more rv" style={{ "--i": "4" }} href="#h-how">
                See how it works
                <MoreArrow />
              </a>
            </div>
            <div className="cell pan anim">
              <div className="pan-bg" style={{ "--pc": "var(--p-sand)" }}></div>
              <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/hr.jpg')" }}></div>
              <div className="pan-ui">
                <div className="demo">
                  <div className="demo-h">
                    <div>
                      <b>Final selections · 18 students</b>
                      <br />
                      <small>Sample data</small>
                    </div>
                    <span className="st ok">Shared</span>
                  </div>
                  <div className="share rows">
                    <div className="colg" style={{ "--r": "0" }}>
                      <span className="av">C1</span>
                      <div className="t">
                        <b>College 1</b>
                        <small>6 selected</small>
                      </div>
                      <span className="st ok">Seen by placement cell</span>
                    </div>
                    <div className="colg" style={{ "--r": "1" }}>
                      <span className="av">C2</span>
                      <div className="t">
                        <b>College 2</b>
                        <small>4 selected</small>
                      </div>
                      <span className="st ok">Seen by placement cell</span>
                    </div>
                    <div className="colg" style={{ "--r": "2" }}>
                      <span className="av">C3</span>
                      <div className="t">
                        <b>College 3</b>
                        <small>5 selected</small>
                      </div>
                      <span className="st info">Delivered</span>
                    </div>
                    <div className="colg" style={{ "--r": "3" }}>
                      <span className="av">C5</span>
                      <div className="t">
                        <b>College 5</b>
                        <small>3 selected</small>
                      </div>
                      <span className="st info">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rule"></div>

      <div className="row" id="h-how">
        <div className="head split2">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <span className="eb rv">
              <i></i>How it works
            </span>
            <Split as="h2" className="dt h2 anim">
              Run a campus drive in four steps
            </Split>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="steps4">
          <div className="st4" style={{ "--i": "0" }}>
            <span className="big">01</span>
            <h3>Post the drive</h3>
            <p>Role, package, eligibility and rounds.</p>
            <div className="card-s">
              <div className="mini-row">
                <span>Graduate Trainee</span>
                <span className="st mute">Draft</span>
              </div>
            </div>
          </div>
          <div className="st4" style={{ "--i": "1" }}>
            <span className="big">02</span>
            <h3>Receive applicants</h3>
            <p>Only students who meet your rules.</p>
            <div className="card-s">
              <div className="mini-row">
                <span>Applicants</span>
                <span className="st info">212</span>
              </div>
            </div>
          </div>
          <div className="st4" style={{ "--i": "2" }}>
            <span className="big">03</span>
            <h3>Screen in rounds</h3>
            <p>Aptitude, technical and HR in one board.</p>
            <div className="card-s">
              <div className="mini-row">
                <span>Technical</span>
                <span className="st info">64 in round</span>
              </div>
            </div>
          </div>
          <div className="st4" style={{ "--i": "3" }}>
            <span className="big">04</span>
            <h3>Share and hire</h3>
            <p>Results and offers reach each college.</p>
            <div className="card-s">
              <div className="mini-row">
                <span>Selected</span>
                <span className="st ok">18</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="h-faq">
        <div className="faq2">
          <div>
            <span className="eb rv">
              <i></i>FAQ
            </span>
            <Split as="h2" className="dt h2 anim" style={{ marginTop: "18px" }}>
              What hiring teams ask first
            </Split>
          </div>
          <div>
            <div className="faq rv">
              <details className="rv">
                <summary>
                  Which colleges can we hire from?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">Colleges whose placement cells use TalentSnaps can invite you to run drives with them.</p>
              </details>
              <details className="rv" style={{ "--i": "1" }}>
                <summary>
                  Can we use our own rounds?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">
                  Yes. You set the sequence of rounds for each drive, and results are recorded against each one.
                </p>
              </details>
              <details className="rv" style={{ "--i": "2" }}>
                <summary>
                  Are assessment scores comparable across colleges?
                  <span className="pm">
                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                  </span>
                </summary>
                <p className="ans">
                  When your drive uses the built-in aptitude round, every applicant takes the same assessment, so scores can be
                  compared directly.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row" id="h-cta">
        <div className="cta2">
          <div className="txt">
            <span className="eb rv">
              <i></i>Book a demo
            </span>
            <Split as="h2" className="dt h2 anim">
              Run your next campus drive with TalentSnaps
            </Split>
            <p className="lede rv" style={{ "--i": "2" }}>
              In a 30-minute demo we set up a sample drive with your rounds and walk you through applicants and shortlists.
            </p>
            <div className="ctas rv" style={{ "--i": "3", justifyContent: "flex-start" }}>
              <a className="btn btn-blue" href="#h-post">
                Book a demo
                <Icon name="arrow" />
              </a>
              <a className="btn btn-line" href="#h-features">
                See features
              </a>
            </div>
          </div>
          <div className="cell pan anim">
            <div className="pan-bg" style={{ "--pc": "var(--p-sand)" }}></div>
            <div className="pan-photo" style={{ backgroundImage: "url('/images/landing/hr.jpg')" }}></div>
          </div>
        </div>
      </div>
    </>
  );
}
