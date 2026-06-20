export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerInner">
        
        <div className="footerLeft">
          <h3>0G Studio AI</h3>
          <p>
            AI-powered content creation platform built for the 0G Zero Cup Hackathon.
            Generate tweets, blogs, LinkedIn posts, and marketing copy with persistent decentralized memory.
          </p>
        </div>

        <div className="footerCenter">
          <h4>Zero Cup</h4>
          <p>
            A global AI hackathon by 0G where builders create AI-native apps, agents, and games
            using 0G compute, storage, and blockchain infrastructure.
          </p>
        </div>

        <div className="footerRight">
          <h4>Built With</h4>
          <ul>
            <li>React + Node.js</li>
            <li>0G Chain (Galileo Testnet)</li>
            <li>0G Storage SDK</li>
            <li>AI Agents (n8n)</li>
          </ul>
        </div>

      </div>

      <div className="footerBottom">
        © {new Date().getFullYear()} 0G Studio AI · Built for Zero Cup Hackathon
      </div>
    </footer>
  );
}