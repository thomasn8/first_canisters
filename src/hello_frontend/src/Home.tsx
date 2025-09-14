import { Link } from "react-router-dom";

function Home() {
    return (
        <div>
            <h1>Router:</h1>
            <nav>
                <Link to="/symmetric">• Encrypt/decrypt message with a personal symmetric key</Link><br/>
                <Link to="/ibe">• Asymetrically encrypt message for a recipient or Decrypt a received message</Link><br/>
            </nav>
        </div>
    );
}

export default Home;