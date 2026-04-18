import { Navbar } from "@/widgets";
import { Footer } from "@/widgets";
import { Contacts, AboutUs, Projects} from "@/pages";
import "./App.css";
import { PageRoutes } from "./providers/router/routeConfig";
import { Route, Routes } from "react-router-dom";
import { renderRoutes } from "./providers/router/renderRoutes";

function App() {
	return (
		<div>
			<Navbar
				links={PageRoutes.filter((route) => route.showInNavbar)}
			></Navbar>
			<Routes>{renderRoutes(PageRoutes)}</Routes>
			<Routes>
				<Route path="/contacts" element={<Contacts />} />
				<Route path="/about" element={<AboutUs />} />
				<Route path="/projects" element={<Projects />} />
			</Routes>
			<Footer></Footer>
		</div>
	);
}

export default App;
