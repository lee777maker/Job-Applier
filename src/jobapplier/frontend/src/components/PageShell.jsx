export default function PageShell({ children }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"0 16px 40px" }}>
      <div style={{
        width:"min(1100px, 100%)",
        border:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(0,0,0,0.20)",
        borderRadius:"18px",
        padding:"28px",
        minHeight:"74vh"
      }}>
        {children}
      </div>
    </div>
  );
}
