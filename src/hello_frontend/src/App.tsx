import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Symmetric from "./demo/Symmetric";

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/symmetric" element={<Symmetric/>}/>
      </Routes>
    </div>
  );
}

export default App;
