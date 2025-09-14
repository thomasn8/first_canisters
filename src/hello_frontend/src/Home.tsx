import { Link } from "react-router-dom";

function Home() {
    return (
        <div>
            <h1>Router:</h1>
            <nav>
                <Link to="/symmetric">Symmetric encryption/decryption for caller</Link><br/>
            </nav>
        </div>
    );
}

export default Home;