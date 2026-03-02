import { Link } from "react-router-dom"

const Navbar = () => {

    return (
        <header>
            <div className="navbar">

                <div className="nav-item">
                    <Link to="/">
                        <h1>SoleSearch</h1>
                    </Link>
                </div><hr />

                <div className="nav-item">
                    <Link to="/">
                        <h1>Mens</h1>
                    </Link>
                </div><hr />

                <div className="nav-item">
                    <Link to="/">
                        <h1>Womens</h1>
                    </Link>
                </div><hr />

                <div className="nav-item">
                    <Link to="/">
                        <h1>Kids</h1>
                    </Link>
                </div><hr />

                <div className="nav-item">
                    <Link to="/">
                        <h1>Teens</h1>
                    </Link>
                </div><hr />
            </div>
        </header>
    )
}

export default Navbar