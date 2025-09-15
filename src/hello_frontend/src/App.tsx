import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Symmetric from "./examples/Symmetric";
import Ibe from "./examples/Ibe";

// TODO: encrypt a string with timelock
// TODO: encrypt a data with its id

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/symmetric" element={<Symmetric/>}/>
        <Route path="/ibe" element={<Ibe/>}/>
      </Routes>
    </div>
  );
}

export default App;
