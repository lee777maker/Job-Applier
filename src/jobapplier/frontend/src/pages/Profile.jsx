import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import "../styles/pages.css";

export default function Profile() {
  return (
    <>
      <Navbar />
      <PageShell>
        <div className="rowBetween">
          <h1 className="titleBig">Candidate</h1>
          <button className="yellowBtn">Edit</button>
        </div>

        <div className="grid4">
          <div>
            <div className="label">First Name</div>
            <div className="value">Lethabo</div>
          </div>
          <div>
            <div className="label">Last Name</div>
            <div className="value">Neo</div>
          </div>
          <div>
            <div className="label">Email</div>
            <div className="value">lethaboneo@icloud.com</div>
          </div>
          <div>
            <div className="label">Phone Number</div>
            <div className="value">0814478357</div>
          </div>
        </div>

        <h2 className="sectionTitle">Experience</h2>
        <div className="card">
          <div className="rowBetween">
            <div className="cardTitle">Junior Software Engineer</div>
            <div className="muted">1 year</div>
          </div>
          <p className="muted">
            Designed and built an end-to-end system that automatically sources job listings, tailors CVs,
            generates cover letters, and contacts recruiters via email and LinkedIn.
          </p>
        </div>
      </PageShell>
    </>
  );
}
