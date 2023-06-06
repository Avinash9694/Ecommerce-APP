import { Routes,Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import PageNotFound from "./pages/PageNotFound";
import Policy from "./pages/Policy";
import About from "./pages/About";
import Contact from "./pages/Contact";
function App() {
  return (
    <Routes>
      <Route path = '/' element= { <HomePage/> } />
      <Route path = '/about' element= { <About/> } />
      <Route path = '/contact' element= { <Contact/> } />
      <Route path = '/policy' element= { <Policy/> } />
      <Route path = '/*' element= { <PageNotFound/> } />
    </Routes>
  );
}

export default App;