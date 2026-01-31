import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import "../styles/pages.css";

const jobs = [
  { title: "Graduate Software Engineer", company: "EY" },
  { title: "Agentic Engineer", company: "Deloitte" },
  { title: "Junior Automation Engineer", company: "Lexis" },
];

export default function Jobs() {
  return (
    <>
      <Navbar />
      <PageShell>
        <h1 className="titleBig">Recommended Jobs</h1>

        <div className="jobsRow">
          {jobs.map((j, i) => (
            <div className="jobCard" key={i}>
              <div>
                <div className="jobTitle">{j.title}</div>
                <div className="muted">{j.company}</div>
              </div>
              <button className="circleBtn">↗</button>
            </div>
          ))}
        </div>
      </PageShell>
    </>
  );
}
