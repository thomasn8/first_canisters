import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Symmetric from "./examples/Symmetric";
import Ibe from "./examples/Ibe";
import Nft from "./examples/Nft";

// TODO: timelock encryption example

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/symmetric" element={<Symmetric/>}/>
        <Route path="/ibe" element={<Ibe/>}/>
        <Route path="/nft" element={<Nft/>}/>
      </Routes>
    </div>
  );
}

export default App;
