import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import "../styles/pages.css";

export default function Home() {
  return (
    <>
      <Navbar />
      <PageShell>
        <div className="homeCenter">
          <h1 className="homeTitle">Enter Job description</h1>

          <div className="chatBox">
            <input className="chatInput" placeholder="What would you like to know?" />
            <button className="sendBtn">↑</button>
          </div>
        </div>
      </PageShell>
    </>
  );
}
